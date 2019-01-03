class ref_count_intf
{
    unsigned d_count;
public: 
    ref_count_intf() : d_count(0) {}
    virtual ~ref_count_intf() = default; 
    
    ref_count_intf(const ref_count_intf&) = default;
    ref_count_intf& operator=(const ref_count_intf&) = default;

    virtual void destroy()=0;

    void inc() { ++d_count;  }
    bool dec() {
        if (--d_count == 0) { destroy(); }
        return d_count == 0;
    } 
};


template<typename T>
class shared_ptr
{
    template<typename U>
    class ref_count_impl: public ref_count_intf
    {
        U *pu;
    public:
        ref_count_impl(U *_pu) : pu(_pu) {}
        virtual void destroy() { delete pu; }
    };

    ref_count_intf *d_rc_p;
    T              *d_t_p;
public:
    shared_ptr() : d_rc_p(nullptr), d_t_p(nullptr) {}
    /*  
    shared_ptr(T *t) : d_rc_p(new ref_count_impl<T>(t)), d_t_p(t) {
        d_rc_p->inc();
    }
    */
    shared_ptr(const shared_ptr& s) : d_rc_p(s.d_rc_p), d_t_p(s.d_t_p) {
        d_rc_p->inc();
    }
    /*
    shared_ptr& operator=(const shared_ptr& s) {
        if (this != &s) {
            if (d_rc_p && d_rc_p->dec()) { delete d_rc_p; }
            d_t_p = s.get();
            d_rc_p = s.d_rc_p;
            d_rc_p->inc();
        }
        return *this;
    }
    */
    ~shared_ptr() {   
        if(d_rc_p && d_rc_p->dec()) {
            delete d_rc_p;
        } 
    }

    template<typename U>
    explicit shared_ptr(U *pu) 
    : d_rc_p(new ref_count_impl<U>(pu)), d_t_p(pu) {
        d_rc_p->inc();
    }
    
    template<typename U>
    friend class shared_ptr;

    template<typename U>
    shared_ptr(const shared_ptr<U>& s) 
    : d_rc_p(s.d_rc_p), d_t_p(s.get()) { d_rc_p->inc(); }

    template<typename U>
    shared_ptr& operator=(const shared_ptr<U>& s) {
        if (!d_t_p || d_t_p != s.get()) { 
            if (d_rc_p && d_rc_p->dec()) { delete d_rc_p; }
            d_t_p = s.get();
            d_rc_p = s.d_rc_p;
            d_rc_p->inc();
        }
        return *this;
    }
    T&  operator*() const { return *d_t_p; }
    T * operator->() const { return d_t_p; }
    T * get() const { return d_t_p; }
};

class Foo {
public:
    Foo() = default;
    virtual ~Foo() = default;
};

class Bar : public Foo {};

int main() {
    shared_ptr<Foo> foo;
    {
        shared_ptr<Bar> bar(new Bar);
        foo = bar;
    }
    return 0;
}
