<template src="./data-table.html"></template>

<script>
import Vue from 'vue'
import moment from 'moment'

export default {
  name: 'data-table',

  props: {
    // data definition of columns
    headData: {
      type: Array,
      default: () => [],
    },
    // rows
    data: {
      type: Array,
      default: () => [],
    },
    // number of rows per page
    max: {
      type: Number,
      default: 20,
    },
    // activate pagination
    pager: {
      type: Boolean,
      default: true,
    },
    // array of column keys to ignore
    ignoreColumns: {
      type: Array,
      default: () => [],
    },
    // activate search feature
    search: {
      type: Boolean,
      default: true,
    },
    // activate icon feature
    icons: {
      type: Boolean,
      default: true,
    },
    // activate sortable columns
    sortable: {
      type: Boolean,
      default: true,
    },
    // activate select feature
    selectable: {
      type: Boolean,
      default: false,
    },
    // key used by row selection
    selectedRowIndexKey: {
      type: String,
      default: null,
    },
  },

  computed: {
    pages () {
      let length = 1
      if (this.rowData.length) {
        length = this.rowData.length / this.max
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
        'max-width': `${parseInt((100 / this.columnCount), 10)}%`,
      }
    },

    withBlock () {
      return !!this.$slots.default
    },

    shouldPagerBeDisplayed () {
      return this.pager && !this.isFilterActive && this.rowData.length
    },
  },

  data () {
    return {
      id: -1,
      show: false,
      rowData: null,
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
      isFilterActive: false,
    }
  },

  created () {
    this.rowData = this.data
    this.init()
  },

  methods: {
    /**
     * @name init
     * @description initialize this page
     * @fires this.pushBreadcrumb
     * @fires transition
     */
    init () {
      this.extractColumnsToShow()
      
      this.id = this._uid
      this.columnCount = this.headData.length

      this.rowData = this.rowData.map((row) => {
        const newRow = row
        newRow.$isSelected = false
        return newRow
      })

      this.$nextTick(() => {
        this.show = true
      })
    },

    noSearchFilter () {
      return this.searchColumnFilter.filter(column => column === '').length === 0
    },

    /**
     * Get lens color for states based on meta information
     * @param {Object} columnMeta
     * @param {any} value
     */
    lensColor (columnMeta, value) {
      let color = ''
      if (columnMeta.stateMapping) {
        const index = `${value}`
        if (columnMeta.stateMapping[index]) {
          color = columnMeta.stateMapping[index]
        }
      } else {
        color = Boolean(value) ? 'green' : 'red'
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
      const newPath = path
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
        return icon(this.rowData[index])
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
      }
    },

    /**
     * Extract column names which should appear in table
     */
    extractColumnsToShow () {
      this.headData.forEach((item) => {
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
      if (this.rowData && this.rowData[0]) {
        return `${this.rowData[0].constructor.name}-${index}`
      }
      return `row-${index}`
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
      this.headData.reduce((onlyState, column) => {
        if (column.key === index && column.onlyState) {
          return column.onlyState
        }
        return onlyState
      }, false)
    },

    /**
     * Check if action button/icon should be active
     * @param meta
     * @param row
     */
    isActionActive (meta, row) {
      if (meta.isActive) {
        return meta.isActive(row)
      }
      return meta.link !== ''
    },

    /**
     * Check if action button/icon should be hidden
     * @param meta
     * @param row
     */
    isActionHidden (meta, row) {
      if (meta.isHidden) {
        return meta.isHidden(row)
      }
      return false
    },

    columnFilterMatched(row) {
      for (let column in this.searchColumnFilter) {
        if (row[column]
            .toString()
            .toLowerCase()
            .indexOf(this.searchColumnFilter[column].toLowerCase()) < 0) {
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

    toggleSelectAllRows () {
      this.rowData = this.rowData.map((row) => {
        const newRow = row
        newRow.$isSelected = this.selectAllRowsFlag
        return newRow
      })
      this.selectedRowsByIndexKey = this.getAllSelectedRows()
      this.$emit('rowSelectionChange', this.selectedRowsByIndexKey)
    },

    rowClicked (e) {
      this.$emit('rowClicked', e)
    },

    getAllSelectedRows () {
      return this.rowData.reduce((acc, row) => {
        if (row.$isSelected) {
          acc.push(row[this.selectedRowIndexKey])
        }
        return acc
      }, [])
    },

    toggleDataRowSelection () {
      this.selectAllRowsFlag = false
      // this.SelectedRows will be handled by checkbox

      if (this.selectedRowIndexKey) {
        this.selectedRowsByIndexKey = this.getAllSelectedRows()
        this.$emit('rowSelectionChange', this.selectedRowsByIndexKey)
      }
    },

    highlight (column, text) {
      const key = column.key
      text = column.type
        ? this.resolveValue(column, text)
        : text
      if (this.searchColumnFilter[key] != null) {
        const pattern = this.searchColumnFilter[key]
        if (pattern !== '') {
          const index = text.toString().toLowerCase().indexOf(pattern.toLowerCase())
          if (index >= 0) {
            return `${text.toString().substring(0, index)}
              <span class="highlight">
              ${text.substring(index, index + pattern.length)}
              </span>
              ${text.substring(index + pattern.length)}`
          }
        }
      }
      return text
    },

    resolveValue (column, text) {
      if (column.type) {
        switch (column.type) {
          case 'date':
            return column.format ? moment(text).format(column.format) : moment(text).format('YYYY-MM-DD')
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
          this.sortedData = this.rowData
          this.sortedData.sort(this.sortData(head.key, this.sortedColumns[head.key]))
        }
        this.$forceUpdate()
      }
    },

    sortData (key, sort) {
      let sortOrder = 1
      if (sort === 'DESC') {
        sortOrder = -1
      }
      return (a, b) => {
        const valueA = typeof a[key] === 'string' && a[key].match(/^[\d]+[.|,]?[\d]+?$/)
                     ? parseFloat(a[key])
                     : a[key]

        const valueB = typeof b[key] === 'string' && b[key].match(/^[\d]+[.|,]?[\d]+?$/)
                     ? parseFloat(b[key])
                     : b[key]

        const result = (valueA < valueB) ? -1 : (valueA > valueB) ? 1 : 0
        return result * sortOrder
      }
    },

    getAncestor (node, tagName) {
      const tagNameUpper = tagName.toUpperCase()
      let traversingNode = node

      while (traversingNode) {
        if (traversingNode.nodeType === 1 && traversingNode.nodeName === tagNameUpper) {
          return traversingNode
        }
        traversingNode = traversingNode.parentNode
      }

      return null
    },

    encode (value, noHyphen) {
      if (!value) {
        return ''
      }
      value += '' // Convert integer
      value = value.toLowerCase()
      value = value.replace('.', '')
      value = value.replace(/Ä/g, 'Ae')
      value = value.replace(/ä/g, 'ae')
      value = value.replace(/Ö/g, 'Oe')
      value = value.replace(/ö/g, 'oe')
      value = value.replace(/Ü/g, 'Ue')
      value = value.replace(/ü/g, 'ue')
      value = value.replace(/ß/g, 'ss')
      value = value.replace(' ', '-')
      value = value.replace(/[^a-z0-9-_]/gi, '')
      if (noHyphen && noHyphen === true) {
        value = value.replace('-', '_')
      }
      return value
    },
  },
}
</script>

<style src="./data-table.styl" lang="stylus"></style>
<style src="./data-table-plugins.styl" lang="stylus"></style>
