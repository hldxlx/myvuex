let Vue;
class Store{// 用户获取的是这个Store类的实例
    constructor(options){
        //options 获取用户new 实例时传入的所有属性

        this.vm = new Vue({  //创建vue实例，保证状态更新可以刷新视图（响应式数据的变化）//这里new Vue也会走到那个mixin逻辑
            data:{//默认这个状态 会被使用Object.definedProperty重新定义
                state:options.state
            }
        })

    }
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
