# The Algorithm

> "The R&D fixer algorithm controls our lives."
>
> ~smv, circa 2026

Before discussing the fixer algorithm, we must discuss the contraints decided by
the R&D Fixer Algorithm Committee (RFAC).

We'd also like to credit our friend and liability, Jay Patel, for his
contributions in the making of this algorithm.

## The constraints

1. Each student has a total of 100 tokens to be distributed among N projects.
2. A student must either allocate 0 tokens to a project, or a number between 5
   and 25.
3. Each professor has a total of 100 tokens PER STUDENT.
4. Neither students not professors are allowed to allocate the same number of
   tokens to multiple entities.

## Pseudocode

```
S = {S1, S2, S3, ...} -> set of students
Pr = {Pr1, Pr2, ...}  -> set of professors
P = {P1, P2, P3, ...} -> set of projects

MATCHFIX(S, Pr, P) {
    while S != PHI:
        select some Si from S
        select most preferred Pi from P which was never picked for S
        if Pi has no slots left AND Si is more preferred than some Sj in Pi:
            pick the least preferred student Sk for Pi
            S = S union Sk
            add Si to Pi
            remove Sk from Pi
        else
            S = S - Si
            add Si to Pi
}
```
