import Vue from 'vue';
import VueMaterial from 'vue-material';
import Main from './main';

import 'vue-material/dist/vue-material.min.css'

Vue.use(VueMaterial);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  ...Main,
});
