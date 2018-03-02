import 'es6-promise/auto'

import dataTable from './src/components/data-table/data-table.vue'

if (!global._babelPolyfill) {
	require('babel-polyfill')
}

export {
  dataTable
}