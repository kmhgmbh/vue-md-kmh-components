<template src="./data-table.html"></template>

<script>
import helper from './../../mixins/helper.vue'

export default {
  name: 'data-table',

  mixins: [helper],

  props: {
    headData: {
      type: Array,
      default: () => {
        return []
      }
    },
    data: {
      type: Array,
      default: () => {
        return []
      }
    },
    ignoreColumns: {
      type: Array,
      default: () => {
        return []
      }
    },
    addRowButton: {
      type: Object,
      default: () => {
        return {}
      }
    },
    search: {
      type: Boolean,
      default: true
    },
    icons: {
      type: Boolean,
      default: true
    },
    pager: {
      type: Boolean,
      default: true
    },
    sortable: {
      type: Boolean,
      default: true
    },
    selectable: {
      type: Boolean,
      default: false
    },
    max: {
      type: Number,
      default: 20
    },
    selectedRowIndexKey: {
      type: String,
      default: null
    }
  },

  computed: {
    pages () {
      let length = 1
      if (this.data.length) {
        length = this.data.length / this.max
        if (length < 1) {
          length = 1
        }
      }
      length = Math.ceil(length)
      return length
    },

    dynamicWidth () {
      if (this.$mq.resize && this.$mq.below(600)) {
        return ''
      }
      return {
        'max-width': parseInt((100 / this.columnCount)) + '%'
      }
    },

    withBlock () {
      return !!this.$slots.default
    },

    shouldPagerBeDisplayed () {
      return this.pager && !this.isFilterActive && this.data.length
    }

  },

  data () {
    return {
      id: -1,
      show: false,
      searchContainer: [],
      searchColumnFilter: [],
      sortedColumns: [],
      columnCount: 0,
      page: 1,
      sortedData: [],
      visibleBlock: null,
      selectedRows: [],
      selectedRowsByIndexKey: [],
      selectAllRowsFlag: false,
      emptyHead: '...',
      columsToShow: [],
      isFilterActive: false
    }
  },

  created () {
    this.init()
    this.id = this._uid
    this.columnCount = this.headData.length
  },

  watch: {
    selectAllRowsFlag () {
      this.selectAllRows()
    }
  },

  methods: {

    noSearchFilter () {
      for (let column in this.searchColumnFilter) {
        if (this.searchColumnFilter[column] !== '') {
          return false
        }
      }
      return true
    },

    /**
     * Get lens color for states based on meta information
     * @param {Object} columnMeta
     * @param {any} value
     */
    lensColor (columnMeta, value) {
      let color = ''
      if (columnMeta.stateMapping) {
        const index = value + '' // Stringify
        if (columnMeta.stateMapping[index]) {
          color = columnMeta.stateMapping[index]
        }
      } else {
        // Fallback for old onlyState usage
        if (value === 1) {
          color = 'yellow'
        } else if (value === 2) {
          color = 'green'
        }
      }
      return color
    },

    /**
     * @name doIconAction
     * @description create an link + redirect || generate + open sidebar
     * @param {String} path
     * @param {Object} rowData
     * @fires this.linkCustom
     * @fires this.setSidebar
     */

    generateAndExecuteLink (path, rowData) {
      var newPath = path
      for (let keyIndex in path.params) {
        let key = path.params[keyIndex]
        let value = ''
        if (typeof key === 'object') {
          for (let childKeyIndex in key) {
            let childKey = key[childKeyIndex]
            value += value !== '' ? '-' : ''
            value += rowData[childKey]
          }
          newPath.params[keyIndex] = this.encode(value)
        }
        this.linkCustom(newPath)
      }
    },

    getIconName (icon, index) {
      if (typeof icon === 'function') {
        return icon(this.data[index])
      }
      return icon
    },

    /**
     * Handle CTA button click
     *
     * @param {Object} meta
     * @param {Object} rowData
     */
    triggerCTA (meta, rowData) {
      if (meta.action) {
        meta.action(rowData)
      } else if (meta.link) {
        this.generateAndExecuteLink(meta.link, rowData)
      } else {
        console.warn('CTA can\'t be executed', meta)
      }
    },

    /**
     * @name init
     * @description initialize this page
     * @fires this.pushBreadcrumb
     * @fires transition
     */
    init () {
      this.extractColumnsToShow()

      this.$nextTick(() => {
        this.show = true
      })
    },

    /**
     * Extract column names which should appear in table
     */
    extractColumnsToShow () {
      this.headData.forEach(item => {
        if (item.key) {
          this.columsToShow.push(item.key)
        }
      })
    },

    /**
     * @name ignore
     * @description check if an column should ignored
     * @requires this.ignoreColumns
     * @return {Boolean}
     */
    ignore (index) {
      return this.ignoreColumns.includes(index) || !this.columsToShow.includes(index)
    },

    rowId (index) {
      if (this.data && this.data[0]) {
        return this.data[0].constructor.name + '-' + index
      } else {
        return 'row-' + index
      }
    },

    /**
     * Check if row is activated and the slot should be visible
     * @param {Number} rowIndex
     */
    isVisibleBlock (rowIndex) {
      const id = this.rowId(rowIndex)
      return this.visibleBlock === id
    },

    /**
     * Toggle row activation and slot visibility
     * Trigger slot inherent component if appropriate method is available
     * @param {Number} rowIndex
     * @param {any} rowData
     */
    toggleBlock (rowIndex, rowData) {
      const id = this.rowId(rowIndex)

      if (this.visibleBlock === id) {
        this.visibleBlock = null
      } else {
        this.visibleBlock = id
        this.$nextTick(() => {
          if (this.$slots.default && this.$slots.default[0].componentInstance && this.$slots.default[0].componentInstance.update) {
            this.$slots.default[0].componentInstance.update(rowData)
          }
        })
      }
    },

    /**
     * @name isOnlyState
     * @description check if an column is only a state (colored ball)
     * @param {String} index
     * @requires this.headData
     * @return {Boolean}
     */
    isOnlyState (index) {
      for (let column of this.headData) {
        if (column.key === index && column.onlyState) {
          return column.onlyState
        }
      }
      return false
    },

    /**
     * Check if action button/icon should be active
     * @param meta
     * @param row
     */
    isActionActive (meta, row) {
      if (meta.isActive) {
        return meta.isActive(row)
      } else {
        return meta.link !== ''
      }
    },

    /**
     * Check if action button/icon should be hidden
     * @param meta
     * @param row
     */
    isActionHidden (meta, row) {
      if (meta.isHidden) {
        return meta.isHidden(row)
      } else {
        return false
      }
    },

    columnFilterMatched (row) {
      for (let column in this.searchColumnFilter) {
        if (row[column].toString().toLowerCase().indexOf(this.searchColumnFilter[column].toLowerCase()) < 0) {
          return false
        }
      }
      return true
    },

    rowOnCurrentPage (index) {
      if (this.noSearchFilter()) {
        const max = this.page * this.max
        const min = max - this.max
        if (index >= min && index < max) {
          return true
        }
        return false
      }
      return true
    },

    pagerPrev () {
      if (this.page > 1) {
        this.page--
      }
    },

    pagerNext () {
      if (this.page < this.pages) {
        this.page++
      }
    },

    selectAllRows () {
      let selectedRowsAll = []
      this.selectedRowsByIndexKey = []
      if (this.selectAllRowsFlag) {
        for (let row in this.data) {
          selectedRowsAll.push(parseInt(row))
          if (this.selectedRowIndexKey) {
            this.selectedRowsByIndexKey.push(this.data[row][this.selectedRowIndexKey])
          }
        }
        this.selectedRows = selectedRowsAll
      } else {
        this.selectedRows = []
      }
    },

    toggleDataRowSelection (rowData, index, event) {
      this.selectAllRowsFlag = false
      // this.SelectedRows will be handled by checkbox
      if (event.target.type === 'checkbox' && this.selectedRowIndexKey) {
        const indexKey = rowData[this.selectedRowIndexKey]
        const keyIndex = this.selectedRowsByIndexKey.indexOf(indexKey)
        if (keyIndex >= 0) {
          this.selectedRowsByIndexKey.splice(keyIndex, 1)
        } else {
          this.selectedRowsByIndexKey.push(indexKey)
        }
      }
    },

    highlight (column, text) {
      if (this.searchColumnFilter[column] != null) {
        const pattern = this.searchColumnFilter[column]
        if (pattern !== '') {
          const index = text.toString().toLowerCase().indexOf(pattern.toLowerCase())
          if (index >= 0) {
            return text.toString().substring(0, index) + '<span class="highlight">' + text.substring(index, index + pattern.length) + '</span>' + text.substring(index + pattern.length)
          }
        }
      }
      return text
    },

    updateSearchColumnFilter (input, column) {
      this.searchColumnFilter[column] = input
      this.isFilterActive = !this.noSearchFilter()
      this.$forceUpdate()
    },

    clearSearchContainer (id, column) {
      if (this.searchContainer.indexOf(id) > -1) {
        this.searchContainer.splice(this.searchContainer.indexOf(id), 1)
      }
      this.updateSearchColumnFilter('', column)
    },

    getSearchContainer (id) {
      return this.searchContainer.includes(id)
    },

    setSearchContainer (id) {
      this.searchContainer.push(id)
      this.$forceUpdate()
    },

    sortedAsc (head) {
      if (!head.keys) {
        if (this.sortedColumns[head.key] === 'ASC') {
          return true
        }
      }
      return false
    },

    sortedDesc (head) {
      if (!head.keys) {
        if (this.sortedColumns[head.key] === 'DESC') {
          return true
        }
      }
      return false
    },

    sort (head) {
      if (!head.keys && this.sortable) {
        if (this.sortedAsc(head)) {
          this.sortedColumns = []
          this.sortedColumns[head.key] = 'DESC'
        } else {
          this.sortedColumns = []
          this.sortedColumns[head.key] = 'ASC'
        }
        if (this.sortedColumns[head.key] !== null) {
          this.sortedData = this.data
          this.sortedData.sort(this.sortData(head.key, this.sortedColumns[head.key]))
        }
        this.$forceUpdate()
      }
    },

    sortData (key, sort) {
      var sortOrder = 1
      if (sort === 'DESC') {
        sortOrder = -1
      }
      return function (a, b) {
        const valueA = typeof a[key] === 'string' && a[key].match(/^[\d]+[.|,]?[\d]+?$/) ? parseFloat(a[key]) : a[key]
        const valueB = typeof b[key] === 'string' && b[key].match(/^[\d]+[.|,]?[\d]+?$/) ? parseFloat(b[key]) : b[key]

        var result = (valueA < valueB) ? -1 : (valueA > valueB) ? 1 : 0
        return result * sortOrder
      }
    },

    getAncestor (node, tagName) {
      tagName = tagName.toUpperCase()
      while (node) {
        if (node.nodeType === 1 && node.nodeName === tagName) {
          return node
        }
        node = node.parentNode
      }
      return null
    }
  }
}
</script>

<style src="./data-table.styl" lang="stylus"></style>
<style src="./data-table-plugins.styl" lang="stylus"></style>
