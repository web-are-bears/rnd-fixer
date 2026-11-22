package allocator

/*
#cgo CXXFLAGS: -std=c++17 -O2 -Dmain=allocate_main
#include <stdlib.h>
#include "bridge.h"
*/
import "C"

import (
	"errors"
	"fmt"
	"sort"
	"unsafe"
)

// Student mirrors tuple<string, map<string,int>>: id and tokens given to each project.
type Student struct {
	ID     string         `json:"id"`
	Tokens map[string]uint32 `json:"tokens"` // project id -> tokens
}

// Project mirrors tuple<string, int, map<string,int>>: id, occupancy and tokens given to each student.
type Project struct {
	ID        string         `json:"id"`
	Occupancy int            `json:"occupancy"`
	Tokens    map[string]uint32 `json:"tokens"` // student id -> tokens
}

var ErrInvalidInput = errors.New("invalid input")

func Allocate(students []Student, projects []Project) (map[string]string, error) {
	var a arena
	defer a.free()

	cs := allocSlice[C.alloc_student](&a, len(students))
	for i, s := range students {
		cs[i].id = a.str(s.ID)
		cs[i].tokens, cs[i].n_tokens = a.tokens(s.Tokens)
	}
	cp := allocSlice[C.alloc_project](&a, len(projects))
	for i, p := range projects {
		cp[i].id = a.str(p.ID)
		cp[i].occupancy = C.int(p.Occupancy)
		cp[i].tokens, cp[i].n_tokens = a.tokens(p.Tokens)
	}

	var (
		res  *C.alloc_pair
		nRes C.int
		cErr *C.char
	)
	rc := C.run_allocate_c(C.int(len(students)), C.int(len(projects)),
		ptr(cs), ptr(cp), &res, &nRes, &cErr)
	defer C.free(unsafe.Pointer(cErr))

	switch rc {
	case C.ALLOC_OK:
	case C.ALLOC_INVALID_INPUT:
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, C.GoString(cErr))
	default:
		return nil, fmt.Errorf("allocator: %s", C.GoString(cErr))
	}
	defer C.free_allocation(res, nRes)

	out := make(map[string]string, int(nRes))
	for _, p := range unsafe.Slice(res, int(nRes)) {
		out[C.GoString(p.student)] = C.GoString(p.project)
	}
	return out, nil
}

type arena struct{ ptrs []unsafe.Pointer }

func (a *arena) alloc(size uintptr) unsafe.Pointer {
	if size == 0 {
		size = 1
	}
	p := C.calloc(1, C.size_t(size))
	if p == nil {
		panic("allocator: out of C memory")
	}
	a.ptrs = append(a.ptrs, p)
	return p
}

func (a *arena) str(s string) *C.char {
	p := C.CString(s)
	a.ptrs = append(a.ptrs, unsafe.Pointer(p))
	return p
}

func (a *arena) tokens(m map[string]uint32) (*C.alloc_token, C.int) {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys) // deterministic order
	ts := allocSlice[C.alloc_token](a, len(keys))
	for i, k := range keys {
		ts[i].id = a.str(k)
		ts[i].tokens = C.int(m[k])
	}
	return ptr(ts), C.int(len(keys))
}

func (a *arena) free() {
	for _, p := range a.ptrs {
		C.free(p)
	}
	a.ptrs = nil
}

func allocSlice[T any](a *arena, n int) []T {
	var zero T
	p := a.alloc(uintptr(n) * unsafe.Sizeof(zero))
	return unsafe.Slice((*T)(p), n)
}

func ptr[T any](s []T) *T {
	if len(s) == 0 {
		return nil
	}
	return &s[0]
}