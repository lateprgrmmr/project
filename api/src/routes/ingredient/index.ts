import express, { Request, Response } from "express";

const router = express.Router();

interface IngredientRequest {
  name: string;
  unit: string;
  cost_per_unit: number;
  vendor_id: number;
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = req.app.get("db");
    const ingredients = await db.ingredient.find();
    res.json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = req.app.get("db");
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ingredient ID" });
    }

    const ingredient = await db.ingredient.findOne(id);
    
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    res.json(ingredient);
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = req.app.get("db");
    const { name, unit, cost_per_unit, vendor_id }: IngredientRequest = req.body;

    // Validate required fields
    if (!name || !unit || cost_per_unit === undefined || !vendor_id) {
      return res.status(400).json({ 
        message: "Missing required fields: name, unit, cost_per_unit, vendor_id" 
      });
    }

    // Validate data types
    if (typeof name !== 'string' || typeof unit !== 'string') {
      return res.status(400).json({ 
        message: "Name and unit must be strings" 
      });
    }

    if (typeof cost_per_unit !== 'number' || cost_per_unit < 0) {
      return res.status(400).json({ 
        message: "Cost per unit must be a positive number" 
      });
    }

    if (typeof vendor_id !== 'number' || vendor_id <= 0) {
      return res.status(400).json({ 
        message: "Vendor ID must be a positive number" 
      });
    }

    // Check if vendor exists
    const vendor = await db.entity.findOne(vendor_id);
    if (!vendor) {
      return res.status(400).json({ 
        message: "Vendor not found" 
      });
    }

    // Create the ingredient
    const newIngredient = await db.ingredient.insert({
      name: name.trim(),
      unit,
      cost_per_unit,
      vendor_id
    });

    res.status(201).json({
      message: "Ingredient created successfully",
      ingredient: newIngredient
    });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
