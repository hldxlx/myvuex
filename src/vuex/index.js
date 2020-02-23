let Vue;
//自己写个forEach用来遍历对象
let forEach = (obj,callback)=>{
    Object.keys(obj).forEach(key=>{//这样写的好处 不需写for in 也不需判断里面的私有属性
        callback(key,obj[key])
    })
}

class Store{// 用户获取的是这个Store类的实例
    constructor(options){
        //options 获取用户new 实例时传入的所有属性

        this.vm = new Vue({  //创建vue实例，保证状态更新可以刷新视图（响应式数据的变化）//这里new Vue也会走到那个mixin逻辑;为何这里能new Vue 因为install时
            //把Vue传给了全局的（第一行的）Vue了
            data:{//默认这个状态 会被使用Object.definedProperty重新定义
                state:options.state
            }
        });
        let getters = options.getters;//获取用户传入的getters
        this.getters = {};  //这个是store里的getters
        //遍历对象的功能非常地常用
        forEach(getters,(getterName,value)=>{
            //传入是一个函数，但是想把它变成属性
            //把用户传入的属性定义到我们当前的Store上，而且是通过Object.defineProperty来实现
            Object.defineProperty(this.getters,getterName,{
                get:()=>{
                    return value(this.state)
                }
            })
        });
        //我需要将用户定义的mutation 放到store上 先订阅 (将函数订阅到一个数组中) 才能发布（让数组的函数依次折行）
        let mutations = options.mutations;//用户传进来时先订阅好，等会commit我就让它折行
        //订阅的过程一般都会用一个数组来保存所有的mutations
        this.mutations = {};//用户传进来的数据先把它定位到这个对象里面；等会一commit就找到对应的方法让它折行
        forEach(mutations,(mutationName,value)=>{
            this.mutations[mutationName] = (payload) =>{//订阅
                value(this.state,payload);
            }
        });
        let actions = options.actions;
        this.actions = {};
        forEach(actions,(actionName,value)=>{// 最后我们会做一个监控 看一下是不是异步方法都在action中折行的 不是在mutation中折行的
            this.actions[actionName] = (payload) =>{
                value(this,payload);//this为当前的store  调用action action会帮我们调用mutation
            }
        });
    }
    commit = (mutationName,payload)=>{//es7的写法 这样能保证调用commit时this永远指向当前的store的实例
        this.mutations[mutationName](payload);//发布
    }
    dispatch = (actionName,payload) =>{//发布的时候会找到对应的action折行
        this.actions[actionName](payload);
    }
    //es6中类的访问器
    get state(){//类的属性访问器 获取实例上的state属性就会折行此方法
        return this.vm.state//这个state就是被监控过的state
    }
}
//官方api
const install = (_Vue) =>{//Vue的构造函数  （为了当前这个插件里面不用再去依赖于Vue了（不需import Vue），而是通过用户把这个_Vue手动传给我来实现）
    Vue = _Vue;//Vue的构造函数  把用户传过来的_Vue作为当前这个插件的Vue来使用
    //放到vue的原型上 不对 因为默认会给所有的实例增加
    //只从当前的根实例开始 所有根实例的子组件才有$store方法
    Vue.mixin({//组件的创建过程是先父后子
        beforeCreate(){
            console.log('he');
            //把父组件的store属性 放到每个组件的实例上
            console.log(this.$options.name);
            if(this.$options.store){//根实例
                this.$store = this.$options.store//在根实例上加上这样一个属性 这个属性就等于用户传过来的那个实例的store
            }else{
                this.$store = this.$parent && this.$parent.$store
            }
        }
    })//抽离公共的逻辑 放一些方法（每次创建vue实例都会被混入进去）
}

export default {
    Store,
    install
}
