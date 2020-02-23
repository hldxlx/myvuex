import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from './vuex'

Vue.use(Vuex)//默认会折行当前插件（即Vuex）的install方法
//通过 Vuex中的一个属性 Store 创建一个store的实例
export default new Vuex.Store({
    state:{//单一数据源  以前的data
      age:10
    },
    strict:true,//严格模式，表示只能通过mutation来改变状态
    getters:{//以前的computed
        myAge(state){//以前用vue中的计算属性
            return state.age + 20
        }
    },
    //更新状态的唯一方式就是通过mutation
    mutations:{//mutation更改状态只能采用同步（严格模式下使用）  以前的methods
        //payload 载荷
        syncChange(state,payload){//修改状态的方法 同步的更改
            state.age += payload
        }
    },
    actions:{
        asyncChange({commit},payload){//第一个参数是store 可通过{commit}解构出commit来
            setTimeout(()=>{
                commit('syncChange',payload);//提交到mutation里
            },1000)
        }
    }
})