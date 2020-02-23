<template>
  <div id="app">
    它{{$store.state.age}}
    我{{$store.getters.myAge}}
    <button @click="syncChange()">点我同步更改</button>
    <button @click="asyncChange()">点我异步更改</button>
  </div>
</template>

<script>


export default {
    name: 'App',
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
