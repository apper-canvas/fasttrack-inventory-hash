import salesOrdersData from "@/services/mockData/salesOrders.json"

let salesOrders = [...salesOrdersData]

const delay = () => new Promise(resolve => setTimeout(resolve, 300))

export const salesOrderService = {
  async getAll() {
    await delay()
    return [...salesOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
  },

  async getById(id) {
    await delay()
    const order = salesOrders.find(so => so.Id === parseInt(id))
    return order ? { ...order } : null
  },

  async create(order) {
    await delay()
    const newId = Math.max(...salesOrders.map(so => so.Id), 0) + 1
    const orderNumber = `SO-${new Date().getFullYear()}-${String(newId).padStart(3, "0")}`
    const newOrder = {
      ...order,
      Id: newId,
      orderNumber,
      orderDate: new Date().toISOString().split("T")[0],
      fulfillmentDate: null
    }
    salesOrders.push(newOrder)
    return { ...newOrder }
  },

  async update(id, data) {
    await delay()
    const index = salesOrders.findIndex(so => so.Id === parseInt(id))
    if (index !== -1) {
      salesOrders[index] = { ...salesOrders[index], ...data }
      return { ...salesOrders[index] }
    }
    throw new Error("Sales order not found")
  },

  async updateStatus(id, status) {
    await delay()
    const index = salesOrders.findIndex(so => so.Id === parseInt(id))
    if (index !== -1) {
      const updateData = { status }
      if (status === "Fulfilled" && !salesOrders[index].fulfillmentDate) {
        updateData.fulfillmentDate = new Date().toISOString().split("T")[0]
      }
      salesOrders[index] = { ...salesOrders[index], ...updateData }
      return { ...salesOrders[index] }
    }
    throw new Error("Sales order not found")
  },

  async delete(id) {
    await delay()
    const index = salesOrders.findIndex(so => so.Id === parseInt(id))
    if (index !== -1) {
      salesOrders.splice(index, 1)
      return true
    }
    throw new Error("Sales order not found")
  }
}