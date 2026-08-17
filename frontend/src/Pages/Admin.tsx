import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetBusinessRegistrationsQuery } from "../queryAndMutation/queries/auth-queries";
import {
  useAcceptBusinessRegistrationMutation,
  useRejectBusinessRegistrationMutation,
} from "../queryAndMutation/mutations/auth-mutation";
import { formatToLocalDate } from "../utils/formatDatetoLocal";

const Admin = () => {
  useEffect(() => {
    document.title = "Admin Page";
  }, []);

  const navigate = useNavigate();
  const { data: businessRegistrations, isLoading } =
    useGetBusinessRegistrationsQuery();
  const { mutate: acceptBusinessRegistration } =
    useAcceptBusinessRegistrationMutation();
  const { mutate: rejectBusinessRegistration } =
    useRejectBusinessRegistrationMutation();
  if (isLoading) return <p>Loading...</p>;
  return (
    <div className="h-screen">
      <h1 className="text-5xl p-5">Admin Page</h1>
      {businessRegistrations && businessRegistrations.length > 0 ? (
        <ul className="flex flex-col gap-5 p-5">
          {businessRegistrations.map((registration) => (
            <li
              key={registration.id}
              className="w-full flex gap-5 p-10 border hover:scale-101"
            >
              <p>{registration.name + " " + registration.email}</p>
              <p>
                Requested on:{" "}
                {formatToLocalDate(new Date(registration.createdAt ?? ""))}
              </p>
              <div className="flex gap-5 justify-end ml-auto">
                <button
                  className="bg-green-400 py-2 px-4 rounded-2xl hover:scale-105"
                  onClick={() => acceptBusinessRegistration(registration.id)}
                >
                  Accept
                </button>
                <button
                  className="bg-red-400 py-2 px-4 rounded-2xl hover:scale-105"
                  onClick={() => rejectBusinessRegistration(registration.id)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center">No business registrations found.</p>
      )}
      <div className="w-full mt-10 flex justify-center">
        <button
          className="bg-violet-500 text-white py-2 px-4 rounded-lg hover:bg-violet-600"
          onClick={() => navigate("/home")}
        >
          Back home
        </button>
      </div>
    </div>
  );
};

export default Admin;
