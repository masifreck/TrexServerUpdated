const mysqlPool = require("../config/db")
const ErrorHander = require("../utils/errorhandling")
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//GET ALL VENDOR LIST
const getvendor=async(req,res,next)=>{
    try{
const data=await mysqlPool.query(' SELECT * FROM addvendor')
if(!data){
    return next(new ErrorHander("vendor not found",404))}
res.status(200).send({
    success:true,
    message:'all vendor db get successfully',
    data:data
})
    }catch(error){
        console.log(error)
        res.status(501).send({
            success:false,
            message:'Error in Get Vendor List Api',
            error
        })
    }
}
//GET VENDOER FOR MAP

const getvendorMap = async (req, res) => {
  try {
    const { min_price, max_price, minLat, maxLat, minLon, maxLon } = req.query;

    // Validate that location parameters are present
    if (!minLat || !maxLat || !minLon || !maxLon) {
      return res.status(400).send({
        success: false,
        message: 'Bounding box parameters are required'
      });
    }

    // Convert location parameters to appropriate types
    const minLatitude = parseFloat(minLat);
    const maxLatitude = parseFloat(maxLat);
    const minLongitude = parseFloat(minLon);
    const maxLongitude = parseFloat(maxLon);

    // Start building the query
    let query = `
      SELECT DISTINCT v.* 
      FROM addvendor v
    `;

    // If price filters are provided, join with the food_items table and add price conditions
    if (min_price && max_price) {
      const minPrice = parseFloat(min_price);
      const maxPrice = parseFloat(max_price);
      query += `
        JOIN food_items f ON v.id = f.vendor_id
        WHERE f.price BETWEEN ? AND ?
        AND v.latitude BETWEEN ? AND ?
        AND v.longitude BETWEEN ? AND ?
      `;
    } else {
      // If no price filters are provided, just filter by location
      query += `
        WHERE v.latitude BETWEEN ? AND ?
        AND v.longitude BETWEEN ? AND ?
      `;
    }

    // Prepare query parameters based on the presence of price filters
    const queryParams = min_price && max_price 
      ? [parseFloat(min_price), parseFloat(max_price), minLatitude, maxLatitude, minLongitude, maxLongitude]
      : [minLatitude, maxLatitude, minLongitude, maxLongitude];

    const [rows] = await mysqlPool.query(query, queryParams);

    if (rows.length === 0) {
      return res.status(404).send({
        success: false,
        message: 'No vendors found in the specified area'
      });
    }

    res.status(200).send({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error in Get Vendor Map API',
      error: error.message
    });
  }
};

  
//GET SINGLE VENDOR 
const getSingleVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.query;

    // Validate that vendorId is provided
    if (!vendorId) {
      return res.status(400).send({
        success: false,
        message: "Vendor ID parameter is required",
      });
    }

    // Log the received vendor ID
    console.log(`Received vendor ID: ${vendorId}`);

    // Query to fetch vendor details by ID
    const query = `
      SELECT * FROM addvendor
      WHERE id = ?
    `;

    // Execute query with vendorId as parameter
    const [vendor] = await mysqlPool.query(query, [vendorId]);

    // Log the query results
    console.log(`Query results: ${JSON.stringify(vendor)}`);

    // Check if vendor exists
    if (!vendor.length) {
      return res.status(404).send({
        success: false,
        message: "Vendor not found",
      });
    }

    // Disable caching for this response
    res.setHeader('Cache-Control', 'no-store');

    // Return vendor details
    res.status(200).send({
      success: true,
      message: 'Vendor details fetched successfully',
      data: vendor[0], // Assuming vendor ID is unique and we expect only one result
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error in Get Vendor Details API',
      error: error.message,
    });
  }
};

  


// Create Vendor 



const createvendor = async (req, res) => {
  try {
      // Handle file upload
      upload.fields([
          { name: 'image', maxCount: 1 },
          { name: 'menuImage', maxCount: 1 },
      ])(req, res, async function (err) {
          if (err) {
              return res.status(500).send({
                  success: false,
                  message: 'Error uploading images',
                  error: err
              });
          }

          const { id, name, longitude, latitude, type, title, description, opentime, closetime, document, documentno, menuTitle, cityname } = req.body;
          const image_file = req.files['image'] ? req.files['image'][0] : null;
          const menuImage_file = req.files['menuImage'] ? req.files['menuImage'][0] : null;

          if (!name) {
              return res.status(400).send({
                  success: false,
                  message: 'Please provide all required data'
              });
          }

          // Prepare Base64 strings
          let imageBase64 = null;
          let menuImageBase64 = null;

          if (image_file) {
              imageBase64 = image_file.buffer.toString('base64');
          }

          if (menuImage_file) {
              menuImageBase64 = menuImage_file.buffer.toString('base64');
          }

          const data = await mysqlPool.query(
              `INSERT INTO addvendor (id, name, longitude, latitude, image_url, type, menuImage, title, description, opentime, closetime, document, documentno, menuTitle, cityname) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [id, name, longitude, latitude, imageBase64, type, menuImageBase64, title, description, opentime, closetime, document, documentno, menuTitle, cityname]
          );

          if (!data) {
              return res.status(501).send({
                  success: false,
                  message: 'Error in insert'
              });
          }

          res.status(200).send({
              success: true,
              message: 'Data saved successfully'
          });
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message: 'Error in create vendor API',
          error
      });
  }
};

const getVendorListByCity = async (req, res) => {
  try {
    const { cityname } = req.query;

    // Validate that cityname is provided
    if (!cityname) {
      return res.status(400).send({
        success: false,
        message: "City name parameter is required"
      });
    }

    // Log the received city name
    console.log(`Received city name: ${cityname}`);

    // Query to fetch vendors by city name
    const query = `
      SELECT * FROM featuredvendor
      WHERE cityname = ?
    `;

    // Execute query with cityname as parameter
    const [vendors] = await mysqlPool.query(query, [cityname]);

    // Log the query results
    console.log(`Query results: ${JSON.stringify(vendors)}`);

    // Check if any vendors are found
    if (!vendors.length) {
      return res.status(404).send({
        success: false,
        message: "No vendors found for the specified city"
      });
    }

    // Return vendor list
    res.status(200).send({
      success: true,
      message: 'Vendors fetched successfully',
      data: vendors
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error in Get Vendor List by City API',
      error: error.message
    });
  }
};
const createfeaturedvendor = async (req, res) => {
  try {
    const { vendorid } = req.body;

    // Fetch vendor details from addvendor table using vendorid
    const [vendorData] = await mysqlPool.query(
      'SELECT * FROM addvendor WHERE id = ?',
      [vendorid]
    );

    if (!vendorData.length) {
      return res.status(404).send({
        success: false,
        message: 'Vendor not found in addvendor table',
      });
    }

    // Check if the vendor is already featured
    if (vendorData[0].isFeatured) {
      return res.status(400).send({
        success: false,
        message: 'Vendor is already in the featured collection',
      });
    }

    // Update the isFeatured flag in the addvendor table
    const updateResult = await mysqlPool.query(
      'UPDATE addvendor SET isFeatured = ? WHERE id = ?',
      [true, vendorid]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: 'Error updating vendor to featured',
      });
    }

    res.status(200).send({
      success: true,
      message: 'Vendor marked as featured successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in create vendor API',
      error,
    });
  }
};

////*********-------UPDATE SINGLE VENODR-------- *******////


const updateVendor = async (req, res) => {
    try {
        // Handle file upload
        upload.fields([
            { name: 'image', maxCount: 1 },
            { name: 'menuImage', maxCount: 1 },
        ])(req, res, async function (err) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Error uploading images',
                    error: err
                });
            }

            const { id, name, longitude, latitude, type, title, description, opentime, closetime, document, documentno, menuTitle, cityname } = req.body;
            const image_file = req.files['image'] ? req.files['image'][0] : null;
            const menuImage_file = req.files['menuImage'] ? req.files['menuImage'][0] : null;

            if (!id) {
                return res.status(400).send({
                    success: false,
                    message: 'Vendor ID is required'
                });
            }

            // Prepare Base64 strings
            let imageBase64 = null;
            let menuImageBase64 = null;

            if (image_file) {
                imageBase64 = image_file.buffer.toString('base64');
            }

            if (menuImage_file) {
                menuImageBase64 = menuImage_file.buffer.toString('base64');
            }

            // Build SQL update query dynamically based on provided fields
            let updateFields = [];
            let updateValues = [];
            
            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            if (longitude) {
                updateFields.push('longitude = ?');
                updateValues.push(longitude);
            }
            if (latitude) {
                updateFields.push('latitude = ?');
                updateValues.push(latitude);
            }
            if (type) {
                updateFields.push('type = ?');
                updateValues.push(type);
            }
            if (title) {
                updateFields.push('title = ?');
                updateValues.push(title);
            }
            if (description) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }
            if (opentime) {
                updateFields.push('opentime = ?');
                updateValues.push(opentime);
            }
            if (closetime) {
                updateFields.push('closetime = ?');
                updateValues.push(closetime);
            }
            if (document) {
                updateFields.push('document = ?');
                updateValues.push(document);
            }
            if (documentno) {
                updateFields.push('documentno = ?');
                updateValues.push(documentno);
            }
            if (menuTitle) {
                updateFields.push('menuTitle = ?');
                updateValues.push(menuTitle);
            }
            if (cityname) {
                updateFields.push('cityname = ?');
                updateValues.push(cityname);
            }
            if (imageBase64) {
                updateFields.push('image_url = ?');
                updateValues.push(imageBase64);
            }
            if (menuImageBase64) {
                updateFields.push('menuImage = ?');
                updateValues.push(menuImageBase64);
            }

            if (updateFields.length === 0) {
                return res.status(400).send({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updateValues.push(id);

            const query = `UPDATE addvendor SET ${updateFields.join(', ')} WHERE id = ?`;

            const [result] = await mysqlPool.query(query, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).send({
                    success: false,
                    message: 'Vendor not found'
                });
            }

            res.status(200).send({
                success: true,
                message: 'Vendor updated successfully'
            });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in update vendor API',
            error
        });
    }
};

const getFeaturedVendors = async (req, res) => {
  try {
    // Fetch all vendors where isFeatured is true from the addvendor table
    const [featuredVendors] = await mysqlPool.query(
      'SELECT * FROM addvendor WHERE isFeatured = ?',
      [true]
    );

    res.status(200).send({
      success: true,
      data: featuredVendors,
      message: 'Featured vendors fetched successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error fetching featured vendors',
      error,
    });
  }
};
const removeFeaturedVendor = async (req, res) => {
  try {
    const { vendorid } = req.body;

    // Fetch vendor details from addvendor table using vendorid
    const [vendorData] = await mysqlPool.query(
      'SELECT * FROM addvendor WHERE id = ?',
      [vendorid]
    );

    if (!vendorData.length) {
      return res.status(404).send({
        success: false,
        message: 'Vendor not found in addvendor table',
      });
    }

    // Check if the vendor is already not featured
    if (!vendorData[0].isFeatured) {
      return res.status(400).send({
        success: false,
        message: 'Vendor is not in the featured collection',
      });
    }

    // Update the isFeatured flag in the addvendor table to false
    const updateResult = await mysqlPool.query(
      'UPDATE addvendor SET isFeatured = ? WHERE id = ?',
      [false, vendorid]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: 'Error updating vendor to unfeatured',
      });
    }

    res.status(200).send({
      success: true,
      message: 'Vendor removed from featured successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in remove featured vendor API',
      error,
    });
  }
};






module.exports={getvendor,createvendor,getvendorMap,getSingleVendorDetails, getVendorListByCity,createfeaturedvendor,updateVendor,getFeaturedVendors,
  removeFeaturedVendor
}