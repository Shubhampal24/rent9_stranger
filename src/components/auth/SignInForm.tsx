"use client";
// import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast"; // added for notifications
import { jwtDecode } from "jwt-decode";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  // const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    loginId: "",
    pin: ""
  });

  // Form validation state
  const [validation, setValidation] = useState({
    loginId: "",
    pin: ""
  });

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation errors when typing
    if (validation[name as keyof typeof validation]) {
      setValidation({
        ...validation,
        [name as keyof typeof validation]: ""
      });
    }
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newValidation = { loginId: "", pin: "" };

    // Login ID validation
    if (!formData.loginId) {
      newValidation.loginId = "Login ID is required";
      isValid = false;
    }

    // PIN validation
    if (!formData.pin) {
      newValidation.pin = "PIN is required";
      isValid = false;
    }

    setValidation(newValidation);
    if (!isValid) {
      toast.error("Please fill all required fields");
    }
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // Reset error
    setError("");

    if (!validateForm()) {
      return;
    }

    // disable button right away and remember start time
    setIsLoading(true);
    const start = Date.now();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: formData.loginId,
          pin: formData.pin
        }),
      });

      const data = await response.json();
      // console.log(data);
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in");
      }

      // Store token in localStorage or cookies
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        name: data.name,
        loginId: data.loginId,
        role: data.role
      }));

      localStorage.setItem("token",data.token);

      const decodedToken: any = jwtDecode(data.token);

      localStorage.setItem("user", JSON.stringify({

        id: decodedToken.id,
        name: decodedToken.name,
        loginId: decodedToken.loginId,
        role: decodedToken.role,
      }));
      
      // Show success toast and redirect to dashboard
      toast.success("Sign In successful", { duration: 900 });
      setTimeout(() =>{
        router.push("/dashboard");
      }, 900)
    
    } catch (error) {
      let message = "An error occurred during sign in";
      if (error instanceof Error) {
        message = error.message || message;
      }
      setError(message);
      // show a toast for invalid credentials or other errors
      toast.error(message, { duration: 2000, position: "top-center" });
    }
  };

  return (
    <> 
      <div className=" flex flex-col flex-1 lg:w-1/2 w-full
          transition-colors duration-300
          bg-slate-100
          dark:bg-[#0d0d14]"
      >
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        {/* <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link> */}
      </div>    
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
        <div>
          <div className="w-full max-w-md mx-auto rounded-3xl p-8
                            transition-all duration-300
                            bg-white
                            border border-slate-200 
                            dark:bg-[#18181b]/50
                            dark:backdrop-blur-xl
                            dark:border-white/5
                            dark:shadow-2xl"
          >
          <div className="mb-5 sm:mb-8"> 
            <h1 className=" mb-2 font-semibold text-center text-title-sm sm:text-title-md
                    text-gray-800
                    dark:text-white/90">
              Sign In
            </h1>
            <p className="text-sm text-center
                    text-gray-500
                    dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              {/* <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Sign in with Google
              </button> */}
              {/* <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign in with X
              </button> */}
            </div>

            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="  w-full border-t
                                  border-slate-200
                                  dark:border-gray-800"
                >

              </div>
              </div>
              <div className="relative flex justify-center text-sm">
                {/* <span className="p-2 text-gray-400 bg-white dark:bg-[#121212] sm:px-5 sm:py-2">
                  Or
                </span> */}
              </div>
            </div>
            
            {/* {error && (
              <div className="mb-4 p-3 bg-error-50 text-error-500 rounded-lg text-sm dark:bg-error-900/20">
                {error}
              </div>
            )} */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    name="loginId"
                    defaultValue={formData.loginId}
                    onChange={handleChange}
                    placeholder="Enter your login ID" 
                    type="text" 
                    className="  w-full text-sm rounded-xl px-4 py-3.5
                                  border transition-all duration-200
                                  focus:outline-none
                                  bg-white
                                  text-gray-900
                                  border-slate-300
                                  placeholder:text-slate-400
                                  focus:border-[#6F5FE7]
                                  focus:ring-1
                                  focus:ring-[#6F5FE7]/30
                                  dark:bg-[#27272a]/50
                                  dark:text-white
                                  dark:border-white/10
                                  dark:placeholder:text-zinc-600
                                  dark:focus:border-[#6F5FE7]
                                  dark:focus:ring-1
                                  dark:focus:ring-[#6F5FE7]
                                "
                  />
                  {validation.loginId && (
                    <p className="mt-1 text-sm text-error-500">{validation.loginId}</p>
                  )}
                </div>
                <div>
                  <Label>
                    PIN <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="pin"
                      defaultValue={formData.pin}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your PIN"
                      className=" w-full text-sm rounded-xl px-4 py-3.5 pr-12
                                  border transition-all duration-200
                                  focus:outline-none
                                  bg-white
                                  text-gray-900
                                  border-slate-300
                                  placeholder:text-slate-400
                                  focus:border-[#6F5FE7]
                                  focus:ring-1
                                  focus:ring-[#6F5FE7]/30
                                  dark:bg-[#27272a]/50
                                  dark:text-white
                                  dark:border-white/10
                                  dark:placeholder:text-zinc-600
                                  dark:focus:border-[#6F5FE7]
                                  dark:focus:ring-1
                                  dark:focus:ring-[#6F5FE7]"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="  absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2
                            transition-colors duration-150"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {validation.pin && (
                    <p className="mt-1 text-sm text-error-500">{validation.pin}</p>
                  )}
                </div>
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div> */}
                <div>
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-medium rounded-xl
                                transition-all duration-200
                                text-white
                                bg-[#5b4ec2]
                                hover:bg-[#4a3fa8]
                                shadow-md shadow-[#5b4ec2]/30
                                dark:bg-[#6F5FE7]
                                dark:hover:bg-[#5b4ec2]
                                dark:shadow-none
                                disabled:opacity-60
                                disabled:cursor-not-allowed"
                    size="sm"
                    disabled={isLoading}               
                  >
                    {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                      
                            <span
                              className="
                                inline-block w-4 h-4 rounded-full
                                border-2 border-white/30 border-t-white
                                animate-spin
                              "
                            />
                            Signing in...
                          </span>
                        ) : (
                          "Sign in"
                        )}
                  </Button>
                </div>
              </div>
            </form>

            {/* <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
      </div>
    </div>
      <Toaster position="top-center" />
    </>
  );
}