import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    //saving refresh token in db, as not to force user to enter password everytime
    user.refreshToken = refreshToken; //saving refresh token in user document of mongoose db
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError( 
      500,
      "Somethig went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation-not empty
  //check if user already exist using username/email
  //check for images , check for avatar
  //upload them tocloudinary
  //create user object-crate entry in db
  //remove passord and refresh token field from response
  //check for user creation
  //return res

  const { fullName, email, username, password } = req.body;
  console.log(email);

  // if(fullName===""){
  //     throw new ApiError(400, "fullname is required")
  // }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or this username already exist");
  }

  //from multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //   console.log("avatarLocalPath is:",avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is needed");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // console.log("🚀 CLOUDINARY AVATAR RESULT:", avatar);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is needed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body->data
  // username or email
  // find user, if found
  // password check
  // access and refresh Token
  // send cookies

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  //   Access Token: Short lifespan (e.g., 15 min), used to authorize requests.
  // Refresh Token: Long lifespan (e.g., 7 days), used to get new access token without login again.
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //Removing Sensitive Info
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // httpOnly: Prevents JavaScript access to cookies (security against XSS).
  // secure: Sends cookies only over HTTPS.
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, //we have alresy set tokens in cookies, but again giving it to user if he ever need it
        },
        "User is loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken=asyncHandler(async(req, res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

  try {
      const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
      const user=await User.findById(decodedToken?._id)
  
      if(!user){
          throw new ApiError(401, "Invlaid refresh token")
      }
      // matching incoming refresh token and refresh token saved in db
  
      if(incomingRefreshToken!== user?.refreshToken){
          throw new ApiError(401, "Refresh token is expired or used")
      }
       // if matched grant access again
  
       const options ={
          httpOnly:true,
          secure:true
       }
  
       const {accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
  
       return res.status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
          new ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token refreshed")
       )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
    
  }


})

export { registerUser, loginUser, logoutUser, refreshAccessToken};
