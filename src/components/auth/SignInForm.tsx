"use client";
// import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast"; // added for notifications
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
      <div
        className=" flex flex-col flex-1 lg:w-1/2 w-full
          transition-colors duration-300
          bg-slate-100
          dark:bg-[#0d0d14]"
      >
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
          <div>
            <div
              className="w-full max-w-md mx-auto rounded-3xl p-8
                            transition-all duration-300
                            bg-white
                            border border-slate-200 
                            dark:bg-[#18181b]/50
                            dark:backdrop-blur-xl
                            dark:border-white/5
                            dark:shadow-2xl"
            >
              <div className="mb-5 sm:mb-8">
                <h1
                  className=" mb-2 font-semibold text-center text-title-sm sm:text-title-md
                    text-gray-800
                    dark:text-white/90"
                >
                  Sign In
                </h1>
                <p
                  className="text-sm text-center
                    text-gray-500
                    dark:text-gray-400"
                >
                  Enter your username and password to sign in!
                </p>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                </div>

                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="  w-full border-t
                                  border-slate-200
                                  dark:border-gray-800"
                    ></div>
                  </div>
                  <div className="relative flex justify-center text-sm"></div>
                </div>

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
                        <p className="mt-1 text-sm text-error-500">
                          {validation.loginId}
                        </p>
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
                        <p className="mt-1 text-sm text-error-500">
                          {validation.pin}
                        </p>
                      )}
                    </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}