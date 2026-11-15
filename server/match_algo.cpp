#include<iostream>
#include<string>
#include<queue>
#include<map>
#include<tuple>
using namespace std;

int main()
{
	//int no_students=3,no_projects=5;
	//cin>>no_students>>no_projects;
	queue<tuple<string,map<string,int>>> student_alloc;
	queue<tuple<string,int,map<string,int>>> project_alloc;
	tuple<string,map<string,int>> temp_stud_tuple;
	tuple<string,int,map<string,int>> temp_proj_tuple;
	map<string,int> temp_map;

	temp_map={{"data",25},{"compute",25},{"memory",10}};
	temp_stud_tuple=make_tuple("Alice",temp_map);
	student_alloc.push(temp_stud_tuple);

	temp_map={{"data",25},{"compute",15},{"memory",20}};
        temp_stud_tuple=make_tuple("Bob",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"data",20},{"compute",20},{"memory",20}};
        temp_stud_tuple=make_tuple("Callie",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"Alice",100},{"Bob",0},{"Callie",0}};
	temp_proj_tuple=make_tuple("data",2,temp_map);
	project_alloc.push(temp_proj_tuple);

	temp_map={{"Alice",50},{"Bob",25},{"Callie",25}};
        temp_proj_tuple=make_tuple("compute",2,temp_map);
        project_alloc.push(temp_proj_tuple);

	temp_map={{"Alice",34},{"Bob",33},{"Callie",33}};
        temp_proj_tuple=make_tuple("memory",1,temp_map);
        project_alloc.push(temp_proj_tuple);

	//cout<<get<1>(student_alloc.back())["data"]<<endl;

	return 0;
}
