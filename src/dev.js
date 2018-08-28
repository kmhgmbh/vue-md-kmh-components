import Vue from 'vue';
import VueMaterial from 'vue-material';
import Main from './main';

import VueMq from 'vue-mq'

import 'vue-material/dist/vue-material.min.css'

Vue.use(VueMaterial)

Vue.use(VueMq, {
  breakpoints: { // default breakpoints - customize this
    sm: 450,
    md: 1250,
    lg: Infinity,
  }
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  ...Main,
});
