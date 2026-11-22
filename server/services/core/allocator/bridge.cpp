#include "bridge.h"

#include <cstdlib>
#include <cstring>
#include <exception>
#include <iostream>
#include <mutex>
#include <set>
#include <sstream>

int allocate_main();

namespace {

std::mutex g_mu;  // std::cin / std::cout are process-wide: one run at a time

void check_id(const std::string &id, const char *what) {
    if (id.empty()) throw std::invalid_argument(std::string("empty ") + what + " id");
    for (unsigned char c : id)
        if (std::isspace(c))  // main() reads ids with `cin >> string`
            throw std::invalid_argument(std::string(what) + " id '" + id + "' contains whitespace");
}

int tokens_for(const std::map<std::string, int> &tok, const std::string &key) {
    auto it = tok.find(key);
    return it == tok.end() ? 0 : it->second;
}

void validate(int n, int m,
              const std::vector<std::tuple<std::string, std::map<std::string, int>>> &students,
              const std::vector<std::tuple<std::string, int, std::map<std::string, int>>> &projects) {
    if (n <= 0 || m <= 0) throw std::invalid_argument("need at least one student and one project");
    if ((int)students.size() != n)
        throw std::invalid_argument("n = " + std::to_string(n) + " but " +
                                    std::to_string(students.size()) + " students given");
    if ((int)projects.size() != m)
        throw std::invalid_argument("m = " + std::to_string(m) + " but " +
                                    std::to_string(projects.size()) + " projects given");

    std::set<std::string> sids, pids;
    for (auto &s : students) {
        check_id(std::get<0>(s), "student");
        if (!sids.insert(std::get<0>(s)).second)
            throw std::invalid_argument("duplicate student '" + std::get<0>(s) + "'");
    }
    for (auto &p : projects) {
        check_id(std::get<0>(p), "project");
        if (!pids.insert(std::get<0>(p)).second)
            throw std::invalid_argument("duplicate project '" + std::get<0>(p) + "'");
        if (std::get<1>(p) < 0)
            throw std::invalid_argument("project '" + std::get<0>(p) + "': occupancy must be >= 0");
    }
    for (auto &s : students)
        for (auto &kv : std::get<1>(s)) {
            if (!pids.count(kv.first))
                throw std::invalid_argument("student '" + std::get<0>(s) + "': unknown project '" + kv.first + "'");
            if (kv.second < 0)
                throw std::invalid_argument("student '" + std::get<0>(s) + "': tokens must be >= 0");
        }
    for (auto &p : projects)
        for (auto &kv : std::get<2>(p)) {
            if (!sids.count(kv.first))
                throw std::invalid_argument("project '" + std::get<0>(p) + "': unknown student '" + kv.first + "'");
            // main()'s eviction loop starts at min=101: a value >= 101 makes it erase index -1.
            if (kv.second < 0 || kv.second > 100)
                throw std::invalid_argument("project '" + std::get<0>(p) + "': tokens for '" + kv.first +
                                            "' must be in 0..100");
        }
}

char *dup_cstr(const std::string &s) {
    char *p = static_cast<char *>(std::malloc(s.size() + 1));
    if (p) std::memcpy(p, s.c_str(), s.size() + 1);
    return p;
}

}

std::map<std::string, std::string> run_allocate(
    int n, int m,
    const std::vector<std::tuple<std::string, std::map<std::string, int>>> &students,
    const std::vector<std::tuple<std::string, int, std::map<std::string, int>>> &projects) {
    validate(n, m, students, projects);

    // Exact stdin layout of main(): "<#students> <#projects>", then one line per
    // student (pid tokens)*m, then one line per project: pid occupancy (sid tokens)*n.
    std::ostringstream in;
    in << n << ' ' << m << '\n';
    for (auto &s : students) {
        in << std::get<0>(s);
        for (auto &p : projects) in << ' ' << std::get<0>(p) << ' ' << tokens_for(std::get<1>(s), std::get<0>(p));
        in << '\n';
    }
    for (auto &p : projects) {
        in << std::get<0>(p) << ' ' << std::get<1>(p);
        for (auto &s : students) in << ' ' << std::get<0>(s) << ' ' << tokens_for(std::get<2>(p), std::get<0>(s));
        in << '\n';
    }

    std::istringstream cin_buf(in.str());
    std::ostringstream cout_buf;
    {
        std::lock_guard<std::mutex> lock(g_mu);
        std::streambuf *old_in = std::cin.rdbuf(cin_buf.rdbuf());
        std::streambuf *old_out = std::cout.rdbuf(cout_buf.rdbuf());
        std::cin.clear();
        std::cout.clear();
        try {
            allocate_main();
        } catch (...) {
            std::cin.rdbuf(old_in);
            std::cout.rdbuf(old_out);
            std::cin.clear();
            std::cout.clear();
            throw;
        }
        std::cout.flush();
        std::cin.rdbuf(old_in);
        std::cout.rdbuf(old_out);
        std::cin.clear();
        std::cout.clear();
    }

    // main() prints "student: project" per line.
    std::map<std::string, std::string> result;
    std::istringstream out(cout_buf.str());
    for (std::string line; std::getline(out, line);) {
        if (line.empty()) continue;
        auto pos = line.find(": ");
        if (pos == std::string::npos) throw std::runtime_error("unexpected allocator output: " + line);
        result[line.substr(0, pos)] = line.substr(pos + 2);
    }
    return result;
}

extern "C" int run_allocate_c(int n, int m,
                              const alloc_student *students, const alloc_project *projects,
                              alloc_pair **result, int *n_result, char **error) {
    *result = nullptr;
    *n_result = 0;
    *error = nullptr;
    try {
        if (n < 0 || m < 0 || (n > 0 && !students) || (m > 0 && !projects))
            throw std::invalid_argument("bad n / m / array pointers");

        std::vector<std::tuple<std::string, std::map<std::string, int>>> sv;
        sv.reserve(n);
        for (int i = 0; i < n; i++) {
            std::map<std::string, int> tok;
            for (int j = 0; j < students[i].n_tokens; j++) {
                const alloc_token &t = students[i].tokens[j];
                if (!tok.emplace(t.id ? t.id : "", t.tokens).second)
                    throw std::invalid_argument(std::string("student '") + students[i].id +
                                                "': project '" + t.id + "' listed twice");
            }
            sv.emplace_back(students[i].id ? students[i].id : "", std::move(tok));
        }

        std::vector<std::tuple<std::string, int, std::map<std::string, int>>> pv;
        pv.reserve(m);
        for (int i = 0; i < m; i++) {
            std::map<std::string, int> tok;
            for (int j = 0; j < projects[i].n_tokens; j++) {
                const alloc_token &t = projects[i].tokens[j];
                if (!tok.emplace(t.id ? t.id : "", t.tokens).second)
                    throw std::invalid_argument(std::string("project '") + projects[i].id +
                                                "': student '" + t.id + "' listed twice");
            }
            pv.emplace_back(projects[i].id ? projects[i].id : "", projects[i].occupancy, std::move(tok));
        }

        std::map<std::string, std::string> res = run_allocate(n, m, sv, pv);

        alloc_pair *arr = static_cast<alloc_pair *>(std::calloc(res.size() ? res.size() : 1, sizeof(alloc_pair)));
        if (!arr) throw std::bad_alloc();
        int k = 0;
        for (auto &kv : res) {
            arr[k].student = dup_cstr(kv.first);
            arr[k].project = dup_cstr(kv.second);
            k++;
        }
        *result = arr;
        *n_result = k;
        return ALLOC_OK;
    } catch (const std::invalid_argument &e) {  // never let C++ exceptions unwind into Go
        *error = dup_cstr(e.what());
        return ALLOC_INVALID_INPUT;
    } catch (const std::exception &e) {
        *error = dup_cstr(e.what());
        return ALLOC_INTERNAL_ERROR;
    } catch (...) {
        *error = dup_cstr("unknown C++ exception");
        return ALLOC_INTERNAL_ERROR;
    }
}

extern "C" void free_allocation(alloc_pair *result, int n_result) {
    if (!result) return;
    for (int i = 0; i < n_result; i++) {
        std::free(result[i].student);
        std::free(result[i].project);
    }
    std::free(result);
}