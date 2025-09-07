

-- ingredient (base unit + cost)
CREATE TABLE ingredient (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,             -- e.g. "lb", "oz", "g", "ml"
  cost_per_unit NUMERIC(10,2) NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id)
);

-- recipe
CREATE TABLE recipe (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  menu_price NUMERIC(10,2)        -- how much you sell it for
);

-- recipe_ingredient (many-to-many)
CREATE TABLE recipe_ingredient (
  recipe_id INT REFERENCES recipes(id),
  ingredient_id INT REFERENCES ingredients(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,             -- e.g. "oz"
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TYPE entity_type AS ENUM ('customer', 'vendor');

-- entity
CREATE TABLE entity (
  id SERIAL PRIMARY KEY,
  fname TEXT NOT NULL,
  mname TEXT,
  lname TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  type entity_type NOT NULL DEFAULT 'vendor',
  address_id INTEGER REFERENCES addresses(id)
);

-- address
CREATE TABLE address (
  id SERIAL PRIMARY KEY,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL
);