#include<bits/stdc++.h>
using namespace std;

int main()
{
	//int no_students=3,no_projects=5;
	//cin>>no_students>>no_projects;
	queue<tuple<string,unordered_map<string,int>>> student_alloc;
	vector<tuple<string,int,unordered_map<string,int>>> project_alloc;

	map<string,vector<tuple<string,unordered_map<string,int>>>> stud_proj_map;

	tuple<string,unordered_map<string,int>> temp_stud_tuple;
	tuple<string,int,unordered_map<string,int>> temp_proj_tuple;
	unordered_map<string,int> temp_map;

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
	project_alloc.push_back(temp_proj_tuple);

	temp_map={{"Alice",50},{"Bob",25},{"Callie",25}};
        temp_proj_tuple=make_tuple("compute",2,temp_map);
        project_alloc.push_back(temp_proj_tuple);

	temp_map={{"Alice",34},{"Bob",33},{"Callie",33}};
        temp_proj_tuple=make_tuple("memory",1,temp_map);
        project_alloc.push_back(temp_proj_tuple);

	//cout<<get<1>(student_alloc.back())["data"]<<endl;
	
	for(auto i:project_alloc) stud_proj_map[get<0>(i)]={};

	while(!student_alloc.empty())
	{
		temp_stud_tuple=student_alloc.front();
		student_alloc.pop();
		if(!get<1>(temp_stud_tuple).empty())
		{
			int max=-1;
			string max_alloc_proj="";
			for(auto i:get<1>(temp_stud_tuple))
			{
				if(max<i.second)
				{
					max=i.second;
					max_alloc_proj=i.first;
				}
			}
			
			//cout<<get<0>(temp_stud_tuple)<<" "<<max_alloc_proj<<": "<<max<<endl;

			for(auto i:project_alloc)
			{
				if(max_alloc_proj==get<0>(i))
				{
					temp_proj_tuple=i;
					break;
				}
			}
			if(stud_proj_map[max_alloc_proj].size()<get<1>(temp_proj_tuple))
			{}
		}
	}

	return 0;
}
