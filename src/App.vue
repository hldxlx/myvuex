<template>
  <div id="app">
    <!--把那个被监控过的state用到这个模板中，它就会把当前的这个组件的依赖收集起来-->
    <!--如果点击那个按钮，它就会触发状态的更新，那当前视图就会更新-->
    它{{$store.state.age}}

    我{{$store.getters.myAge}}
    <button @click="syncChange()">点我同步更改</button>
    <button @click="asyncChange()">点我异步更改</button>
    <!--{{$store.state.a.age}}-->
    <!--{{$store.state.b.age}}-->
    <!--{{$store.state.b.c.age}}-->
  </div>
</template>

<script>


export default {
    name: 'app',
    beforeCreate(){
        console.log('组件');
    },
    methods:{
      syncChange(){
          this.$store.commit('syncChange',10)
      },
      asyncChange(){
          this.$store.dispatch('asyncChange',99)
      }
    }

}
</script>

<style>

</style>
