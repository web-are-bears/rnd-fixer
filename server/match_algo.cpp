#include<iostream>
#include<vector>
using namespace std;

int main()
{
	int no_students=0,no_projects=0;
	cin>>no_students>>no_projects;
	vector<vector<int>> stud_alloc_mat(no_students,vector<int>(no_projects,0));
	vector<vector<int>> prof_alloc_mat(no_projects,vector<int>(no_students,0));
	for(int i=0;i<no_students;i++) for(int j=0;j<no_projects;j++) cin>>stud_alloc_mat[i][j];
	for(int i=0;i<no_projects;i++) for(int j=0;j<no_students;j++) cin>>prof_alloc_mat[i][j];
}
