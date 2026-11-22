#ifndef ALLOCATOR_BRIDGE_H
#define ALLOCATOR_BRIDGE_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char *id;
    int tokens;
} alloc_token;

typedef struct {
    const char *id;
    const alloc_token *tokens;
    int n_tokens;
} alloc_student;

typedef struct {
    const char *id;
    int occupancy;
    const alloc_token *tokens;
    int n_tokens;
} alloc_project;

typedef struct {
    char *student;
    char *project;
} alloc_pair;

enum { ALLOC_OK = 0, ALLOC_INVALID_INPUT = 1, ALLOC_INTERNAL_ERROR = 2 };

int run_allocate_c(int n, int m,
                   const alloc_student *students, const alloc_project *projects,
                   alloc_pair **result, int *n_result, char **error);

void free_allocation(alloc_pair *result, int n_result);

#ifdef __cplusplus
}  /* extern "C" */
#endif

/* ------------------------------- C++ API -------------------------------- */
#ifdef __cplusplus
#include <map>
#include <stdexcept>
#include <string>
#include <tuple>
#include <vector>

std::map<std::string, std::string> run_allocate(
    int n, int m,
    const std::vector<std::tuple<std::string, std::map<std::string, int>>> &students,
    const std::vector<std::tuple<std::string, int, std::map<std::string, int>>> &projects);
#endif

#endif