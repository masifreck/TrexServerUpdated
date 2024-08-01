-- Table for vendors
CREATE TABLE IF NOT EXISTS addvendor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    longitude DECIMAL(10, 7),
    latitude DECIMAL(10, 7),
    image_url LONGTEXT,  -- Adjusted to LONGTEXT to handle larger image data
    type VARCHAR(255),
    menuImage LONGTEXT,  -- Adjusted to LONGTEXT to handle larger image data
    title VARCHAR(255),
    description TEXT,
    opentime TIME,
    closetime TIME,
    document VARCHAR(255),
    documentno VARCHAR(255),
    menuTitle VARCHAR(255),
    cityname VARCHAR(255)
);

-- Table for food items
CREATE TABLE IF NOT EXISTS food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url LONGTEXT,  -- Adjusted to LONGTEXT to handle larger image data
    description TEXT,
    FOREIGN KEY (vendor_id) REFERENCES addvendor(id)
);
