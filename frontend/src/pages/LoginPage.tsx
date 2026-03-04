import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { tryLogin } from "../util/api";
import { useState } from "react";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");

    try {
      const result = await tryLogin(data.email, data.password);

      if (result) {
        if (result.must_change_password) {
          navigate("/change-password");
        } else {
          navigate("/home");
        }
      } else {
        setServerError("Invalid email or password");
      }
    } catch {
      setServerError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-800">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-2">
            Please sign in to your account
          </p>
        </div>

        {serverError && (
          <div className="mb-4 text-sm text-red-600 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition"
              {...register("email", {
                required: "Email is required",
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-gray-900 font-medium cursor-pointer hover:underline underline-offset-4"
          >
            Register
          </span>
        </div>
      </div>
    </div>
  );
}
