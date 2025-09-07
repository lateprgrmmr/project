import { connectDb } from "./connection"
// import { IngredientDAO } from "./dao/IngredientDAO";
// import { RecipeDAO } from "./dao/RecipeDAO";



export async function databaseConnectionFunction() {
    return connectDb();
}

// export default {
//     ingredient: new IngredientDAO(),
//     recipe: new RecipeDAO()
// }