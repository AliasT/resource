<template>
  <!-- 重构版: 使用随机数据存储，减少大量的vuex模版代码 ！！！ -->
  <div class="loader-container" ref="loader" >
    <div><slot name="content" v-for="(item, i) in items" :item="item" :index="i"></slot></div>
    <p class="load-hint" v-show="disabled">{{ errorMessage || '没有更多数据了' }}</p>
    <p class="load-hint" v-show="!disabled" ref="indicator">
      <img class="loader-loading" :src="loading" />数据加载中...
    </p>
  </div>
</template>

<script>
  import loading from '@/assets/default.svg'
  import { mapGetters } from 'vuex'
  import Vue from 'vue'
  import { makeAsyncAction } from '@/store/vuex-utils'

  const LIMIT = 15
  export default {
    name: 'loader2',
    data() {
      return {
        disabled: false,
        loading,
        errorMessage: '',
      }
    },

    computed: {
      ...mapGetters(['paginates']),
      items() {
        return this.$store.state.PAGINATES_ARRAY_CONTAINER[this.__id]
      }
    },
    mounted() {
      // 初始化加载一次
      if(!this.disabled) { this.loadMore() }
      // 注册滚动事件
      (document.querySelector(this.wrapper) || window).addEventListener('scroll', this.loadMore)
    },
    created() {
      this.__id = this.$route.fullPath
      this.action = makeAsyncAction(this.url, null /* commit type 传 null */)

      const cur = this.paginates[this.__id]
      if(cur) {
        if(cur.page > cur.pages) this.disabled = true
      } else {
        // 组件初始化在全局设置一个参数记录分页请求参数
        this.$store.commit('SET_PAGINATE', { key: this.__id, limit: LIMIT, page: 1 })
        // 重置空数组
        this.$store.commit('CLEAR_FACTORY_ARRAY', { key: this.__id })
      }
    },

    // fetch 为下拉加载的方法，params为提供的额外参数
    // fetch必须返回一个promise
    props: {
      url: { type: String, required: true },
      wrapper: { type: String, required: false },
      payload: Object
    },
    watch: {
      payload(newValue) {
        this.clear()
      },
    },
    methods: {
      clear() {
        clearTimeout(this.timeout)
        this.timeout = null
        this.disabled = false
        this.$store.commit('SET_PAGINATE', { key: this.__id, limit: LIMIT, page: 1 })
        // 重置数组
        this.$store.commit('CLEAR_FACTORY_ARRAY', { key: this.__id })
        this.$nextTick(this.loadMore)
      },
      loadSuccess(res, cur) {
        this.timeout = null
        cur.page += 1
        const { result, pages } = res.data
        this.$store.commit('SET_PAGINATE', { key: this.__id, ...cur, pages })
        this.$store.commit('SET_FACTORY_ARRAY', { key: this.__id, result })  // 数组改动
        if(cur.page > res.data.pages) {
          this.disabled = true
        } else {
          this.loadMore()
        }
      },
      loadError(reason) {
        this.disabled = true
        this.errorMessage = reason instanceof Error ? reason.message : reason
      },

      fetch(cur) {
        const { payload={} } = this
        return this.action(this.$store, { ...cur, ...payload })
      },

      loadMore() {
        /* 当路由切换的时候，indicator的ref会是undeinfined 🤔 🤔 🤔， 取nextTick */
        this.$nextTick(() => {
          if(this.timeout /* 当前存在未完成的请求 */ || this.disabled) return
          const { indicator } = this.$refs
          const { top } = indicator.getBoundingClientRect()
          const distance = top >= window.innerHeight ? top - 200 : top /* 将下限提高提前加载 */
          if(window.innerHeight - distance >= 0) {
            this.timeout = setTimeout(() => {
              const cur = this.paginates[this.__id]
              this.fetch(cur).then((res) => this.loadSuccess(res, cur)).catch(this.loadError)
            }, 100)
          }
        })
      }
    },
    destroyed() {
      (document.querySelector(this.wrapper) || window).removeEventListener('scroll', this.loadMore)
    }
  }
</script>

<style lang="scss" scoped>
  @import "src/sass/base.scss";
  @keyframes loading {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .load-hint {
    text-align: center;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    line-height: 20px;
    margin-bottom: 0;
    color: $gray;
    .loading-circle {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: $main-color;
      animation: loading infinite 1s;
    }

    .loader-loading {
      width: 20px;
      height: 20px;
      margin-right: 3px;
    }

    @for $i from 1 through 3 {
      .loading-circle:nth-child(#{$i}) {
        animation-delay: #{$i*0.3}s;
      }
    }
  }
</style>
