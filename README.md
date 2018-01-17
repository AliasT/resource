# resource
vue and react resource

```jsx
const resourceUrl = "/api/post/:postId"
const payload = { postId: 3 }
```

```jsx
/* react */
<Resource url={resourceUrl}>
  {post => (
    post.title
  )}
</Resource>

```

```vue
/* vue:template */
<Resource :url="resourceUrl" :payload="payload">
  <!-- scope slot -->
  <template scope="{ post }>
    {{post.title}}
  </template>
</Resource>

```


