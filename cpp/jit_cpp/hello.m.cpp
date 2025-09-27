#include <iostream>
#include <string>
#include <vector>
#include <unistd.h>
#include <sys/mman.h>

using namespace std;

vector<uint8_t> generate_machine_code(const string& hello_name) {
    std::vector<uint8_t> machine_code {
        0x48, 0xc7, 0xc0, 0x01, 0x00, 0x00, 0x00,
        0x48, 0xc7, 0xc7, 0x01, 0x00, 0x00, 0x00,
        0x48, 0x8d, 0x35, 0x0a, 0x00, 0x00, 0x00,
        0x48, 0xc7, 0xc2, 0x00, 0x00, 0x00, 0x00,
        0x0f, 0x05,               
        0xc3                 
    };
    size_t msg_size = hello_name.size();
    machine_code[24] = (msg_size & 0xFF) >> 0;
    machine_code[25] = (msg_size & 0xFF00) >> 8;
    machine_code[26] = (msg_size & 0xFF0000) >> 16;
    machine_code[27] = (msg_size & 0xFF000000) >> 24;
    for(auto c : hello_name) {
        machine_code.emplace_back(c);
    }
    return machine_code;
}

void show_machine_code(const vector<uint8_t> &machine_code) {
    int count = 0;
    cout << "\nMachine code generated:\n";
    cout << hex;
    for (auto e : machine_code) {
        cout << static_cast<int>(e) << "\t";
        ++count;
        if (count % 7 == 0) {
            cout << '\n';
        }
    }
    cout << dec << "\n\n";
}

size_t compute_memory_size(size_t machine_code_size) {
    size_t page_size = sysconf(_SC_PAGE_SIZE);
    size_t required_memory_size = 0;
    while (machine_code_size > required_memory_size) {
        required_memory_size += page_size;
    }
    return required_memory_size;
}

int main() {
    string name;
    cout << "What is your name?\n";
    getline(cin, name);
    string hello_name = "Hello, " + name + "!\n";

    // generate machine code equivalent to OS write function
    // write(STDIN_FILENO, (const void *) hello_name.c_str(), hello_name.size());
    // supposedly the copy elision/NRVO will be applied here
    auto machine_code = generate_machine_code(hello_name);
    show_machine_code(machine_code);
    
    // allocate memory 
    auto required_memory_size = compute_memory_size(machine_code.size());
    auto mem = static_cast<uint8_t*>(mmap(NULL, required_memory_size, 
                                     PROT_READ | PROT_WRITE | PROT_EXEC, 
                                     MAP_PRIVATE | MAP_ANONYMOUS,
                                     -1, 0));
    if (mem == MAP_FAILED) {
        cerr << "Can't allocate memory\n"; 
        exit(1);
    }

    // copy the generated machine code to the executable mamory
    for(size_t i = 0; i < machine_code.size(); ++i){
        mem[i] = machine_code[i];
    }
            
    // cast the address of generated code to a function pointer 
    using FUNC = void(*)();
    auto func = reinterpret_cast<FUNC>(mem);

    // call the generated function
    func();
    
    // release the mapped memory
    munmap(mem, required_memory_size);

    return 0;
}

