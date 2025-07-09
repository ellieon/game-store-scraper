export type Category = {
    id: number,
   name: string
}

export type Game = {
    name: string,
    price: number,
    subCategory: string,
}

export type CategoryStock = {
    category: Category,
    games: Game[]
}
export type StoreEntry = {
    name: string,
    stock: CategoryStock[]
}