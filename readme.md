# Vue Material Design KMH Components

> A Vue.js 2.0 Component Collection

## Development

### Prerequisites
- Vue

  ```bash
  $ npm i vue
  ```

- Vue Material ^1.0.0-beta-7

  ```bash
  $ yarn add vue-material@beta
  ```


## Usage

### Installation
```bash
$ npm install vue-md-kmh-components
```

```bash
$ yarn add vue-md-kmh-components
```


### Use component

- add material design icons to html
  ```html
  <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic">
  <link rel="stylesheet" href="//fonts.googleapis.com/icon?family=Material+Icons">
  ```

- add to components:
  ```javascript
  import {
    dataTable,
    ...
  } from 'vue-md-kmh-components';
  ...
  components: {
      dataTable,
      ...
  },
  ```

- add Vue Material lib to Vue init script:

  ```javascript
  import VueMaterial from 'vue-material';
  require('vue-material/dist/vue-material.css');
  Vue.use(VueMaterial);
  ```

- in template:
  ```html
  <data-table
      :headData="birdsHeadData"
      :data="birds"
      max=10>
  </data-table>
  ```

- data and headData in parent component
  ```javascript
    birds: [
      {
        name: 'Birdy',
        variety: 'Eagle',
        size: 330,
        wingCount: 1.5,
      },
      {
        name: 'Rosa',
        variety: 'Peacock',
        size: 630,
        wingCount: 2,
      },
    ],
    birdsHeadData: [
      {
        key: 'name',
        name: 'Birds Name',
      }, {
        key: 'variety',
        name: 'Birds variety',
      }, {
        key: 'size',
        name: 'Size of Bird',
        format: (value) => { // dynamically change format
          if (value) {
            return `${value} mm`;
          }
          return '';
        },
      }, {
        key: 'wingCount',
        name: 'Number of wings',
      },
    ],
  ```

- vue slots in table columns
  ```javascript
    birdsHeadData: [
      ...
      {
        key: 'comment',
        name: 'Comment',
        type: 'slot'
      }
      ...
    ],
  ```

  slotname must be named; columnname + underscore + row index

  ```html
    <template :slot="'comment_' + value.id" v-for="value in birds">
      <md-field :key="'comment_' + value.id">
        <label>Comment</label>
        <md-input v-model="comment['comment_' + value.id]"></md-input>
      </md-field>
    </template>
  ```
