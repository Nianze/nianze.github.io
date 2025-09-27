#include <iostream>
#include <atomic>
#include <thread>
#include <vector>
#include <future>

using namespace std;

int main(int argc, char **argv) {
    cout << "start.\n";
    int threadNum{5};
    
    cout << "Input number of threads:\n";
    cin >> threadNum;

    atomic<int> ai{0};
    volatile int vi{0};
    vector<thread> vt;
    vt.reserve(threadNum);

    promise<void> p;
    auto sf = p.get_future().share();

    for (int i = 0; i != threadNum; ++i) {
        vt.emplace_back([&ai, &vi, sf]{
            sf.wait();
            ++ai;
            ++vi;
        });
    }
    
    p.set_value();
    
    for (auto& t : vt) {
        t.join();
    }

    cout << "ai = " << ai << "\t"
         << "vi = " << vi << "\n"; 
    
    return 0; 
}
