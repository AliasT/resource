import React, { Component } from "react";
import PropTypes from "prop-types"
import { debounce, get, pick, isEqual } from "lodash"
import { connect } from "react-redux"
import { requestSource } from "@/actions"
import { ListRender } from "@/libs/ListRender"
import listRenderFunc from "global"

interface InfiniteScrollProps {
  storeParams?: AnyObject
  query?: AnyObject
  useWindow?: boolean
  payload?: AnyObject
  disabled?: boolean
  url?: string
  result?: AnyObject[]
  renderItem?: listRenderFunc
  page?: number
  __name__?: string
  requestMore: (params: any) => Promise<any>
}

export class InfiniteScroll extends Component<InfiniteScrollProps> {
  container?: Element | Window
  timeout?: number | null

  static defaultProps = {
    useWindow: true
  }

  componentDidMount() {
    // 如果服务端渲染的结果
    const { disabled } = this.props
    if (!this.props.useWindow) {
      const wrapper = this.refs.wrapper as Element
      this.container = wrapper.parentNode as Element
    } else {
      this.container = window
    }
    this.container.addEventListener("scroll", this.scrollListener)
    this.scrollListener() /* 初次渲染 */
  }

  detachEventListener = () => {
    if (this.container /* 类型检测要求必须这么做 */) {
      this.container.removeEventListener("scroll", this.scrollListener)
    }
  }

  componentWillReceiveProps(newProps) {
    const { query, useWindow } = newProps
    const isSameQuery = isEqual(query, this.props.query)
    if (!isSameQuery) {
      this.doLoad({
        ...query,
        page: 1
      }).then(() => {
        if (this.container) {
          (this.container as Element).scrollTo(0, 0)
        }
      })
    }
  }

  scrollListener = () => {
    const { disabled, page, query = {} } = this.props
    if (!disabled && this.inViewport()) {
      if (!this.timeout) {
        this.timeout = window.setTimeout(() => this.doLoad({
          page,
          ...query
        }), 50)
      }
    }
  }

  doLoad = (query) => {
    const { __name__, url } = this.props
    return this.props.requestMore({ __name__, query, url }).then(() => {
      /* 可以说是react版的nexttick hack*/
      setTimeout(() => this.timeout = null, 0)
    })
  }

  componentWillUnmount() {
    this.detachEventListener()
  }

  inViewport = () => {
    const indicator  = this.refs.indicator as Element
    const { top } = indicator.getBoundingClientRect()
    return top > 0 && top <= window.innerHeight + 400 /* 提前加载的距离 */
  }

  render() {
    const { result = [], disabled, children, renderItem } = this.props
    // console.log(this.props.children.toString())
    const _renderItem = renderItem ? renderItem : children
    return (
      <div ref="wrapper" className="infinite-scroller-wrapper">
        <div className="infinite-scroller-content">
          <ListRender source={result}>{_renderItem}</ListRender>
        </div>
        {/* is loading */}
        <div className="lds-css" ref="indicator">
          <div className="lds-rolling">
            { disabled ? <div className="loading-text">别拉了，到底了！</div> :
             <div className="loading"></div> }
          </div>
          <style jsx>{
            `@keyframes lds-rolling {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }

            .lds-rolling div.loading-text {
              color: #ccc;
              line-height: 60px;
              text-align: center;
              height: 60px;
            }

            .lds-rolling div.loading {
              width: 20px;
              height: 20px;
              box-sizing: border-box;
              position: absolute;
              top: 50%;
              left: 50%;
              margin-top: -10px;
              margin-left: -10px;
              border: 2px solid #93dbe9;
              border-top-color: transparent;
              border-radius: 50%;
            }
            .lds-rolling div.loading {
              animation: lds-rolling 1s linear infinite;
            }
            .lds-rolling {
              position: relative;
              height: 60px !important;
              box-sizing: border-box;
              margin: 0 auto;
            }`}
        </style></div>
      </div>
    )
  }
}

const mapStateToProps = ({ resource }, ownProps) => {
  return Object.assign({}, get(resource, ownProps.__name__, {}))
}

const mapDispatchToProps = (dispatch) => {
  return {
    requestMore: (params) => dispatch(requestSource(params)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InfiniteScroll)
