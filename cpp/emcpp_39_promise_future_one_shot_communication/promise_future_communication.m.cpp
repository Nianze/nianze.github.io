#include <iostream>
#include <future>
#include <thread>
#include <vector>

using namespace std;

namespace {
void react(int i) {
    cout << "thread number: " << i 
         << " reacted!\n";
}

void detect(int threadNum) {
    promise<void> p;
    auto sf = p.get_future().share();
    vector<thread> vt;
    for (int i = 0; i < threadNum; ++i) {
        vt.emplace_back([sf, i]{
                sf.wait();
                react(i);
                }); 
    }
    cout << "setting and detecting before calling react\n";
    p.set_value();
    for (int i = 0; i != threadNum; ++i) {
        cout << "some additional work: " << i << "\n"; 
    }
    for (auto& t : vt) {
        t.join();
    }
}

}

int main() {
    cout << "start...\n";
    detect(5); 
    cout << "end...\n";
    return 0;
}
