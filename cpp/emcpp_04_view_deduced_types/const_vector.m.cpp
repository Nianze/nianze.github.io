#include <vector>
#include <iostream>
#include <string>
#include <boost/type_index.hpp>


template<typename T>
void f(const T& param)
{
    std::cout << "T = " << typeid(T).name() << '\n';
    std::cout << "param = " << typeid(param).name() << '\n';

    using boost::typeindex::type_id_with_cvr;
    std::cout << "T = " << type_id_with_cvr<T>.pretty_name()
              << '\n';
    std::cout << "param = " << type_id_with_cvr<param>.pretty_name()
              << '\n';
}

int main() {
    using namespace std;
     
    const string s1{"42"};
    const string s2{"2"};
    //vector<const string> v_cst;
    const vector<string> cv_st {s1, s2};
    f(cv_st);
    f(s1);
    f(cv_st[0]);
    return 0;
}
