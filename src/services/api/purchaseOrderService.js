import purchaseOrdersData from "@/services/mockData/purchaseOrders.json"

let purchaseOrders = [...purchaseOrdersData]

const delay = () => new Promise(resolve => setTimeout(resolve, 250))

export const purchaseOrderService = {
  async getAll() {
    await delay()
    return [...purchaseOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
  },

  async getById(id) {
    await delay()
    const order = purchaseOrders.find(po => po.Id === parseInt(id))
    return order ? { ...order } : null
  },

  async create(order) {
    await delay()
    const newId = Math.max(...purchaseOrders.map(po => po.Id), 0) + 1
    const poNumber = `PO-${new Date().getFullYear()}-${String(newId).padStart(3, "0")}`
    const newOrder = {
      ...order,
      Id: newId,
      poNumber,
      orderDate: new Date().toISOString().split("T")[0]
    }
    purchaseOrders.push(newOrder)
    return { ...newOrder }
  },

  async update(id, data) {
    await delay()
    const index = purchaseOrders.findIndex(po => po.Id === parseInt(id))
    if (index !== -1) {
      purchaseOrders[index] = { ...purchaseOrders[index], ...data }
      return { ...purchaseOrders[index] }
    }
    throw new Error("Purchase order not found")
  },

  async updateStatus(id, status) {
    await delay()
    const index = purchaseOrders.findIndex(po => po.Id === parseInt(id))
    if (index !== -1) {
      purchaseOrders[index] = { ...purchaseOrders[index], status }
      return { ...purchaseOrders[index] }
    }
    throw new Error("Purchase order not found")
  },

  async delete(id) {
    await delay()
    const index = purchaseOrders.findIndex(po => po.Id === parseInt(id))
    if (index !== -1) {
      purchaseOrders.splice(index, 1)
      return true
    }
    throw new Error("Purchase order not found")
  }
}