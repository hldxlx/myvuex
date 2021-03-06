let Vue;
//自己写个forEach用来遍历对象
let forEach = (obj,callback)=>{
    Object.keys(obj).forEach(key=>{//这样写的好处 不需写for in 也不需判断里面的私有属性
        callback(key,obj[key])
    })
}
class ModuleCollection{
    constructor(options){//这个options选项就是用户的选项
        //深度遍历 将所有的子模块都遍历一遍
        this.register([],options)//它的递归靠的是一个数组[]；options是用户的根模块
    }
    register(path,rootModule){
        let rawModule = {
            _raw:rootModule,
            _children:{},
            state:rootModule.state
        }

        if(!this.root){//如果它不是根
            this.root = rawModule;//就把这个模块作为根模块
        }else{
            //不停地找到要定义的模块 将这个模块定义到他的父亲上
            let parentModule = path.slice(0,-1).reduce((root,current)=>{
                return root._children[current];
            },this.root);
            parentModule._children[path[path.length-1]] = rawModule;
        }
        if(rootModule.modules){//如果当前的根模块有孩子
            //把子模块也注册进去
            forEach(rootModule.modules,(moduleName,module)=>{
                //将a模块进行注册 传入的参数是  [a],a模块的定义
                //将b模块进行注册 传入的参数是  [b],b模块的定义

                //将c模块进行注册 传入的参数是  [b,c],c模块的定义
                this.register(path.concat(moduleName),module);//把当前的名字拼到path里面去
            })

        }
    }
}
function installModule(store,rootState,path,rawModule) {//rawModule是有 _raw _children state
    let getters = rawModule._raw.getters;
    //没有安装我们的状态 我需要把子模块的状态定义到rootState上
    if(path.length > 0){//当前的path如果长度大于0 说明有子模块了
        //vue的响应式原理 不能增加不存在的属性
        let parentState = path.slice(0,-1).reduce((root,current)=>{//[b,c]
            return rootState[current]
        },rootState);//从根的状态 rootState开始找



        //给这个根状态定义当前模块的名字是path的最后一项
        Vue.set(parentState,path[path.length-1],rawModule.state)//递归地给当前状态赋值
    }
    if(getters){//定义getters
        forEach(getters,(getterName,value)=>{
            if(!store.getters[getterName]){
                Object.defineProperty(store.getters,getterName,{
                    get:()=>{
                        return value(rawModule.state);
                    }
                })
            }
        })
    }
    let mutations = rawModule._raw.mutations;//取用户的mutations
    if(mutations){
        forEach(mutations,(mutationName,value)=>{//[fn,fn,fn] 订阅
            let arr = store.mutations[mutationName] || (store.mutations[mutationName] = []);
            arr.push((payload)=>{
                value(rawModule.state,payload);
            })
        })
    }
    let actions = rawModule._raw.actions;//取用户的action
    if(actions){
        forEach(actions,(actionName,value)=>{//[fn,fn,fn] 订阅
            let arr = store.actions[actionName] || (store.actions[actionName] = []);
            arr.push((payload)=>{
                value(store,payload);
            })
        })
    }
    forEach(rawModule._children,(moduleName,rawModule)=>{//子模块
        installModule(store,rootState,path.concat(moduleName),rawModule)
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
        console.log(getters);
        this.getters = {};  //这个是store里的getters
        this.mutations = {};
        this.actions = {};

        //1 我需要将用户传入的数据进行格式化操作
        this.modules = new ModuleCollection(options);
        console.log(this.modules,'this.modules');

        //递归地安装模块 参数 store/rootState/path/根模块
        installModule(this,this.state,[],this.modules.root);
        //this就是store,它上面有那些getters、mutations、actions的属性
        //this.state 当前的状态
        //[] 递归 要个数组
        //要安装哪个模块 就是刚才格式化后 this.modules.root




        //希望最终格式成这个结果 好处:可以一下看到他们谁是父亲 谁是儿子
        //而且可以一目了然知道a、b、根里面有什么状态
        // let root = {
        //     _raw:rootModule,
        //     state:rootModule.state,
        //     _children:{a:{
        //         _raw:aModule,
        //         _children:{},
        //         state:aModule.state,
        //     },b:{
        //         _raw:bModule,
        //         _children:{
        //             c:{ }
        //         },
        //         state:bModule.state,
        //     }}
        // }

        //--------------------

        //遍历对象的功能非常地常用
        // forEach(getters,(getterName,value)=>{//只能注册第一层
        //     //传入是一个函数，但是想把它变成属性
        //     //把用户传入的属性定义到我们当前的Store上，而且是通过Object.defineProperty来实现
        //     Object.defineProperty(this.getters,getterName,{
        //         get:()=>{
        //             return value(this.state)
        //         }
        //     })
        // });
        //我需要将用户定义的mutation 放到store上 先订阅 (将函数订阅到一个数组中) 才能发布（让数组的函数依次折行）
        //let mutations = options.mutations;//用户传进来时先订阅好，等会commit我就让它折行
        //订阅的过程一般都会用一个数组来保存所有的mutations
        //this.mutations = {};//用户传进来的数据先把它定位到这个对象里面；等会一commit就找到对应的方法让它折行
        // forEach(mutations,(mutationName,value)=>{//只能注册第一层
        //     this.mutations[mutationName] = (payload) =>{//订阅
        //         value(this.state,payload);
        //     }
        // });
        //let actions = options.actions;
        //this.actions = {};
        //只能注册第一层
        // forEach(actions,(actionName,value)=>{// 最后我们会做一个监控 看一下是不是异步方法都在action中折行的 不是在mutation中折行的
        //     this.actions[actionName] = (payload) =>{
        //         value(this,payload);//this为当前的store  调用action action会帮我们调用mutation
        //     }
        // });
    }
    commit = (mutationName,payload)=>{//es7的写法 这样能保证调用commit时this永远指向当前的store的实例
        this.mutations[mutationName].forEach(fn=>fn(payload));//发布
    }
    dispatch = (actionName,payload) =>{//发布的时候会找到对应的action折行
        this.actions[actionName].forEach(fn=>fn(payload));
    }
    //es6中类的访问器
    get state(){//类的属性访问器 获取实例上的state属性就会折行此方法
        return this.vm.state//这个state就是被监控过的state
    }
    //动态注册模块
    registerModule(moduleName,module){
        if(!Array.isArray(moduleName)){
            moduleName = [moduleName]
        }
        this.modules.register(moduleName,module);//只是将模块进行格式化而已
        //?此处有点小问题
        installModule(this,this.state,[],this.modules.root);
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
