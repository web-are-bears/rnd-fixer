#include<bits/stdc++.h>
using namespace std;

int main()
{
	queue<tuple<string,unordered_map<string,int>>> student_alloc;
	vector<tuple<string,int,unordered_map<string,int>>> project_alloc;

	map<string,vector<tuple<string,unordered_map<string,int>>>> stud_proj_map;

	tuple<string,unordered_map<string,int>> temp_stud_tuple;
	tuple<string,int,unordered_map<string,int>> temp_proj_tuple;
	unordered_map<string,int> temp_map;

	int m,n,temp_int1,temp_int2;
	cin>>m>>n;
	string temp_str1,temp_str2;
	for(int i=0;i<m;i++)
	{
		cin>>temp_str1;
		for(int j=0;j<n;j++)
		{
			cin>>temp_str2>>temp_int1;
			temp_map.insert({temp_str2,temp_int1});
		}
		temp_stud_tuple=make_tuple(temp_str1,temp_map);
		student_alloc.push(temp_stud_tuple);
	}

	for(int i=0;i<n;i++)
	{
		cin>>temp_str1>>temp_int1;
		for(int j=0;j<m;j++)
		{
			cin>>temp_str2>>temp_int2;
			temp_map.insert({temp_str2,temp_int2});
		}
		temp_proj_tuple=make_tuple(temp_str1,temp_int1,temp_map);
		project_alloc.push_back(temp_proj_tuple);
	}

	/*
	temp_map={{"data",25},{"compute",25},{"memory",10}};
	temp_stud_tuple=make_tuple("Alice",temp_map);
	student_alloc.push(temp_stud_tuple);

	temp_map={{"data",25},{"compute",15},{"memory",20}};
        temp_stud_tuple=make_tuple("Bob",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"data",20},{"compute",20},{"memory",20}};
        temp_stud_tuple=make_tuple("Callie",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"data",25},{"compute",25},{"memory",10}};
        temp_stud_tuple=make_tuple("test1",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"data",25},{"compute",25},{"memory",10}};
        temp_stud_tuple=make_tuple("test2",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"data",25},{"compute",25},{"memory",10}};
        temp_stud_tuple=make_tuple("test3",temp_map);
        student_alloc.push(temp_stud_tuple);

	temp_map={{"Alice",100},{"Bob",0},{"Callie",0},{"test1",0},{"test2",0},{"test3",0}};
	temp_proj_tuple=make_tuple("data",2,temp_map);
	project_alloc.push_back(temp_proj_tuple);

	temp_map={{"Alice",50},{"Bob",25},{"Callie",25},{"test1",0},{"test2",0},{"test3",0}};
        temp_proj_tuple=make_tuple("compute",2,temp_map);
        project_alloc.push_back(temp_proj_tuple);

	temp_map={{"Alice",34},{"Bob",33},{"Callie",33},{"test1",0},{"test2",0},{"test3",0}};
        temp_proj_tuple=make_tuple("memory",1,temp_map);
        project_alloc.push_back(temp_proj_tuple);
	*/

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
			for(auto i:project_alloc)
			{
				if(max_alloc_proj==get<0>(i))
				{
					temp_proj_tuple=i;
					break;
				}
			}
			stud_proj_map[max_alloc_proj].push_back(temp_stud_tuple);
			while(stud_proj_map[max_alloc_proj].size()>get<1>(temp_proj_tuple))
			{
				int min=101,mini=-1;
				for(int i=0;i<stud_proj_map[max_alloc_proj].size();i++)
				{
					if(get<2>(temp_proj_tuple)[get<0>(stud_proj_map[max_alloc_proj][i])]<min)
					{
						min=get<2>(temp_proj_tuple)[get<0>(stud_proj_map[max_alloc_proj][i])];
						mini=i;
					}
				}
				temp_stud_tuple=stud_proj_map[max_alloc_proj][mini];
				stud_proj_map[max_alloc_proj].erase(stud_proj_map[max_alloc_proj].begin()+mini);
				get<1>(temp_stud_tuple).erase(max_alloc_proj);
				student_alloc.push(temp_stud_tuple);
			}
		}
		else
		{
			for(auto i:project_alloc)
			{
				if(stud_proj_map[get<0>(i)].size()<get<1>(i))
				{
					stud_proj_map[get<0>(i)].push_back(temp_stud_tuple);
					break;
				}
			}
		}
	}

	map<string,string> output;

	for(auto i:stud_proj_map)
	{
		for(auto j:i.second) output[get<0>(j)]=i.first;
	}

	for(auto i:output)
        {
		cout<<i.first<<": "<<i.second<<endl;
        }

	return 0;
}
