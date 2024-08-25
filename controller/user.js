const mysqlPool = require('../config/db');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UserDetail } = require('otpless-node-js-auth-sdk');


// Load environment variables
const clientId = process.env.AUTH_CLIENT_ID || 'Y14XDJ6L5ONEYM22XL6F4LY6G0I635FV';
const clientSecret = process.env.AUTH_CLIENT_SECRET || '95znpyv32h17dfp9v4cl9t383d5m9yqq';


const signup = async (req, res) => {
    try {
        const {userid, email, mobile, name, password, role } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).send({
                success: false,
                message: 'Please provide mandatory fields'
            });
        }

        // Validate email
        if (validator?.isEmail(email)) {
            return res.status(400).send({
                success: false,
                message: 'Please enter a valid email'
            });
        }

        // Check if mobile number already exists
        const [existingUser] = await mysqlPool.query('SELECT * FROM usersignup WHERE mobile = ?', [mobile]);

        if (existingUser.length > 0) {
            return res.status(400).send({
                success: false,
                message: 'Mobile number already exists'
            });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user with default role 'user' if not provided
        const userRole = role || 'user';
        const data
         = await mysqlPool.query('INSERT INTO usersignup (userid, email, mobile, name, password, role) VALUES (?, ?, ?, ?, ?, ?)', [userid, email, mobile,name, hashedPassword, userRole]);

        if (!data) {
            return res.status(500).send({
                success: false,
                message: 'Error while inserting data'
            });
        }

        // Generate JWT token
        const token = jwt.sign({ email, role: userRole }, 'your_jwt_secret_key', { expiresIn: '1h' });

        // Send OTP
        const response = await UserDetail.sendOTP(mobile, null, 'SMS', null, null, 300, 6, clientId, clientSecret);
        
        if (response?.errorMessage) {
            return res.status(500).send({
                success: false,
                message: 'Error while sending OTP',
                error: response.errorMessage
            });
        }

        res.status(200).send({
            success: true,
            message: 'Signup successful, OTP sent to your mobile',
            token,
            data:response,
            userid:userid
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in signup API',
            error
        });
    }
};

//VERIFICATION
const verifyOTP = async (req, res) => {
    const { orderId, otp, mobile } = req.body;

    // Validate the request
    if (!orderId || !otp) {
        return res.status(400).send({
            success: false,
            message: 'Invalid request - orderId and otp are required'
        });
    }

    if (!mobile) {
        return res.status(400).send({
            success: false,
            message: 'Invalid request - mobile is required'
        });
    }

    try {
        // Verify the OTP
        const response = await UserDetail.verifyOTP(null, mobile, orderId, otp, clientId, clientSecret);

        if (response?.errorMessage) {
            return res.status(500).send({
                success: false,
                message: 'Error while verifying OTP',
                error: response.errorMessage
            });
        }

        // Check if OTP is verified
        if (response.isOTPVerified) {
            // Update the user's isVerified status in the database
            const updateQuery = 'UPDATE usersignup SET isVerified = ? WHERE mobile = ?';
            const updateResult = await mysqlPool.query(updateQuery, [1, mobile]); // Set isVerified to 1 (true)

            if (!updateResult) {
                return res.status(500).send({
                    success: false,
                    message: 'Error while updating verification status'
                });
            }

            res.status(200).send({
                success: true,
                message: 'OTP verification successful, user is verified',
                data: response
            });
        } else {
            res.status(400).send({
                success: false,
                message: 'OTP verification failed',
                reason: response.reason
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in OTP verification',
            error
        });
    }
};





const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send({
                success: false,
                message: 'Please provide mandatory fields'
            });
        }

        // Check if username matches either email or mobile in the database
        const [users] = await mysqlPool.query('SELECT * FROM usersignup WHERE email = ? OR mobile = ?', [username, username]);

        if (users.length === 0) {
            return res.status(401).send({
                success: false,
                message: 'Invalid email/mobile or password'
            });
        }

        const user = users[0];

        // Check if the user is verified
        if (user.isVerified !== 1) {
            return res.status(403).send({
                success: false,
                message: 'User is not verified'
            });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send({
                success: false,
                message: 'Invalid email/mobile or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, role: user.role }, 'your_jwt_secret_key', { expiresIn: '1h' });

        // Set the token in the response header
        res.setHeader('Authorization', `Bearer ${token}`);

        res.status(200).send({
            success: true,
            message: 'Login successful',
            role: user.role // Include role in the response
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in login API',
            error
        });
    }
};


//LOGOUT CONTROLLER
const logout = async (req, res) => {
    try {
        // Clear the Authorization header (JWT token) from the response
        res.setHeader('Authorization', '');

        res.status(200).send({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in logout API',
            error
        });
    }
};


const getuser=async(req,res)=>{
    try{
const data=await mysqlPool.query(' SELECT * FROM usersignup')
if(!data){
    return res.status(404).send({
        success:false,
        message:'no record found'
    })
}
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
const getSingleuser = async (req, res) => {
    try {
      let { username } = req.query; // Extract the username from query parameters
      username = decodeURIComponent(username); // Decode the username
  
      // Handle the case where the + symbol is interpreted as a space
      username = username.replace(/\s/g, '+');
      
      console.log("Received username:", username); // Log the received username
  
      // Determine if the username is a mobile number or an email address
      const isMobile = /^\+?\d{10,15}$/.test(username);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
  
      if (!isMobile && !isEmail) {
        return res.status(400).send({
          success: false,
          message: 'Please provide a valid mobile number or email address'
        });
      }
  
      let sqlQuery = 'SELECT userid, name, mobile, email FROM usersignup WHERE';
      const queryParams = [];
  
      if (isMobile) {
        sqlQuery += ' mobile = ?';
        queryParams.push(username);
      } else if (isEmail) {
        sqlQuery += ' email = ?';
        queryParams.push(username);
      }
  
      const [data] = await mysqlPool.query(sqlQuery, queryParams); // Execute the query with parameters
  
      if (!data || data.length === 0) {
        return res.status(404).send({
          success: false,
          message: 'No record found'
        });
      }
  
      res.status(200).send({
        success: true,
        message: 'User record fetched successfully',
        data: data[0] // Assuming you want to return a single user record
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: 'Error in Get User API',
        error
      });
    }
  };
  
  
  
  const sendResetPasswordOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).send({
                success: false,
                message: 'Please provide a mobile number'
            });
        }
console.log('received mobile',mobile)
        // Check if the mobile number exists in the database
        const [existingUser] = await mysqlPool.query('SELECT * FROM usersignup WHERE mobile = ?', [mobile]);

        if (existingUser.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'Mobile number does not exist'
            });
        }

        // Send OTP
        const response = await UserDetail.sendOTP(mobile, null, 'SMS', null, null, 300, 6, clientId, clientSecret);

        if (response?.errorMessage) {
            return res.status(500).send({
                success: false,
                message: 'Error while sending OTP',
                error: response.errorMessage
            });
        }

        res.status(200).send({
            success: true,
            message: 'OTP sent to your mobile',
            data: response
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in sending OTP',
            error
        });
    }
};

const verifyResetPasswordOTP = async (req, res) => {
    const { orderId, otp, mobile } = req.body;

    if (!orderId || !otp || !mobile) {
        return res.status(400).send({
            success: false,
            message: 'Invalid request - orderId, otp, and mobile are required'
        });
    }

    try {
        // Verify the OTP
        const response = await UserDetail.verifyOTP(null, mobile, orderId, otp, clientId, clientSecret);

        if (response?.errorMessage) {
            return res.status(500).send({
                success: false,
                message: 'Error while verifying OTP',
                error: response.errorMessage
            });
        }

        res.status(200).send({
            success: true,
            message: 'OTP verification successful',
            data: response
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in OTP verification',
            error
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { mobile, newPassword } = req.body;

        if (!mobile || !newPassword) {
            return res.status(400).send({
                success: false,
                message: 'Please provide mobile number and new password'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password in the database
        const updateQuery = 'UPDATE usersignup SET password = ? WHERE mobile = ?';
        const updateResult = await mysqlPool.query(updateQuery, [hashedPassword, mobile]);

        if (!updateResult) {
            return res.status(500).send({
                success: false,
                message: 'Error while updating password'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in password reset',
            error
        });
    }
};
const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage }).single('photo'); 

  const updateUser = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error uploading file',
                error: err.message
            });
        }

        try {
            const { userid } = req.query; // Get userid from query parameter
            const { name } = req.body;
            const photo = req.file; // The uploaded file is stored in req.file

            // Debugging: Log the incoming data
            console.log('Received name:', name);
            console.log('Received photo:', photo);

            // Check if userid is provided
            if (!userid) {
                return res.status(400).send({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Check if at least one field (name or photo) is provided
            if (!name && !photo) {
                return res.status(400).send({
                    success: false,
                    message: 'Please provide either name or photo to update'
                });
            }

            // Prepare the fields to update
            let updateFields = [];
            let updateValues = [];

            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }

            if (photo) {
                // Convert photo to Base64
                const photoBase64 = photo.buffer.toString('base64');
                updateFields.push('photo = ?');
                updateValues.push(photoBase64);
            }

            updateValues.push(userid);

            // Update the user details
            const updateQuery = `UPDATE usersignup SET ${updateFields.join(', ')} WHERE userid = ?`;
            const [result] = await mysqlPool.query(updateQuery, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).send({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).send({
                success: true,
                message: 'User details updated successfully',
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error in update API',
                error
            });
        }
    });
};




module.exports = { signup,login,getuser,verifyOTP,getSingleuser ,logout,sendResetPasswordOTP,
    verifyResetPasswordOTP,resetPassword,updateUser
};
