import { useEffect, useState } from "react";
import { CustomerForm } from "./CustomerForm";
import { VehicleForm } from "./VehicleForm";
import { ServiceDetailsForm } from "./ServiceDetailsForm";

const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

const emptyCustomerForm = {
  first_name: "",
  last_name: "",
  dni: "",
  driving_license: "",
  phone: "",
  email: "",
  address: ""
};

const emptyVehicleForm = {
  plate: "",
  vin: "",
  brand: "",
  model: "",
  version: "",
  year: "",
  fuel_type: "gasoline",
  power_hp: "",
  engine_cc: "",
  color: "",
  mileage: "",
  first_registration_date: ""
};

const emptyServiceForm = {
  vehicle_id: "",
  employee_id: "",
  title: "",
  description: "",
  service_type: "repair",
  status: "pending",
  priority: "normal",
  entry_mileage: "",
  observations: ""
};

const SERVICE_TYPES = [
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "inspection", label: "Inspection" },
  { value: "bodywork", label: "Bodywork" },
  { value: "painting", label: "Painting" },
  { value: "cleaning", label: "Cleaning" },
  { value: "detailing", label: "Detailing" },
  { value: "other", label: "Other" }
];

const SERVICE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "budget_pending", label: "Budget pending" },
  { value: "waiting_parts", label: "Waiting parts" },
  { value: "in_repair", label: "In repair" },
  { value: "ready_to_deliver", label: "Ready to deliver" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

const SERVICE_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const FUEL_TYPES = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "electric", label: "Electric" },
  { value: "lpg", label: "LPG" }
];

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getCustomerLabel(customer) {
  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

  return fullName || "Customer";
}

function getVehicleName(vehicle) {
  const vehicleName = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  const year = vehicle.year ? ` ${vehicle.year}` : "";

  return `${vehicleName || "Vehicle"}${year}`;
}

function getMechanicLabel(mechanic) {
  const fullName = `${mechanic.first_name || ""} ${mechanic.last_name || ""}`.trim();
  const email = mechanic.email ? ` · ${mechanic.email}` : "";

  return `${fullName || "Mechanic"}${email}`;
}

export function ServiceForm({ onServiceCreated }) {
  const [step, setStep] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [formData, setFormData] = useState(emptyServiceForm);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isBusy = isSavingCustomer || isSavingVehicle || isSavingService;

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true);
      setError("");

      const [customersResponse, vehiclesResponse, mechanicsResponse] =
        await Promise.all([
          fetch(buildUrl("/customers"), {
            method: "GET",
            headers: getAuthHeaders()
          }),
          fetch(buildUrl("/vehicles"), {
            method: "GET",
            headers: getAuthHeaders()
          }),
          fetch(buildUrl("/mechanics"), {
            method: "GET",
            headers: getAuthHeaders()
          })
        ]);

      const customersData = await customersResponse.json();
      const vehiclesData = await vehiclesResponse.json();
      const mechanicsData = await mechanicsResponse.json();

      if (!customersResponse.ok) {
        throw new Error(
          customersData.error ||
            customersData.message ||
            "Could not load customers."
        );
      }

      if (!vehiclesResponse.ok) {
        throw new Error(
          vehiclesData.error ||
            vehiclesData.message ||
            "Could not load vehicles."
        );
      }

      if (!mechanicsResponse.ok) {
        throw new Error(
          mechanicsData.error ||
            mechanicsData.message ||
            "Could not load mechanics."
        );
      }

      setCustomers(customersData.customers || []);
      setVehicles(vehiclesData.vehicles || []);
      setMechanics(mechanicsData.mechanics || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const customerVehicles = selectedCustomer
    ? vehicles.filter(
        (vehicle) => Number(vehicle.customer_id) === Number(selectedCustomer.id)
      )
    : [];

  const handleCustomerFormChange = (event) => {
    const { name, value } = event.target;

    setCustomerForm((currentData) => ({
      ...currentData,
      [name]: value
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleVehicleFormChange = (event) => {
    const { name, value } = event.target;

    setVehicleForm((currentData) => ({
      ...currentData,
      [name]: value
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleServiceFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleSelectCustomer = (event) => {
    const customerId = Number(event.target.value);
    const customer = customers.find(
      (customer) => Number(customer.id) === customerId
    );

    setSelectedCustomer(customer || null);
    setSelectedVehicle(null);

    setFormData((currentData) => ({
      ...currentData,
      vehicle_id: "",
      entry_mileage: ""
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleSelectVehicle = (event) => {
    const vehicleId = Number(event.target.value);
    const vehicle = vehicles.find(
      (vehicle) => Number(vehicle.id) === vehicleId
    );

    setSelectedVehicle(vehicle || null);

    setFormData((currentData) => ({
      ...currentData,
      vehicle_id: vehicle ? String(vehicle.id) : "",
      entry_mileage: vehicle?.mileage ? String(vehicle.mileage) : ""
    }));

    setError("");
    setSuccessMessage("");
  };

  const validateCustomerForm = () => {
    if (!customerForm.first_name.trim()) {
      return "Please enter the customer's first name.";
    }

    if (!customerForm.last_name.trim()) {
      return "Please enter the customer's last name.";
    }

    if (!customerForm.dni.trim()) {
      return "Please enter the customer's DNI/NIE.";
    }

    if (!customerForm.driving_license.trim()) {
      return "Please enter the customer's driving license.";
    }

    if (!customerForm.phone.trim()) {
      return "Please enter the customer's phone.";
    }

    return "";
  };

  const validateVehicleForm = () => {
    if (!selectedCustomer) {
      return "Please select or create a customer first.";
    }

    if (!vehicleForm.plate.trim()) {
      return "Please enter the vehicle plate.";
    }

    if (!vehicleForm.brand.trim()) {
      return "Please enter the vehicle brand.";
    }

    if (!vehicleForm.model.trim()) {
      return "Please enter the vehicle model.";
    }

    if (!vehicleForm.fuel_type) {
      return "Please select the vehicle fuel type.";
    }

    return "";
  };

  const handleCreateCustomer = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const validationError = validateCustomerForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSavingCustomer(true);

    try {
      const payload = {
        first_name: customerForm.first_name.trim(),
        last_name: customerForm.last_name.trim(),
        dni: customerForm.dni.trim(),
        driving_license: customerForm.driving_license.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || null,
        address: customerForm.address.trim() || null
      };

      const response = await fetch(buildUrl("/customers"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not create customer."
        );
      }

      const newCustomer = data.customer;

      setCustomers((currentCustomers) => [newCustomer, ...currentCustomers]);
      setSelectedCustomer(newCustomer);
      setSelectedVehicle(null);

      setFormData((currentData) => ({
        ...currentData,
        vehicle_id: "",
        entry_mileage: ""
      }));

      setCustomerForm(emptyCustomerForm);
      setShowCustomerForm(false);
      setSuccessMessage("Customer created successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const validationError = validateVehicleForm();

    if (validationError) {
      setError(validationError);

      if (!selectedCustomer) {
        setStep(1);
      }

      return;
    }

    setIsSavingVehicle(true);

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        plate: vehicleForm.plate.trim().toUpperCase().replace(/[\s-]/g, ""),
        vin: vehicleForm.vin.trim()
          ? vehicleForm.vin.trim().toUpperCase()
          : null,
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        version: vehicleForm.version.trim() || null,
        year: vehicleForm.year ? Number(vehicleForm.year) : null,
        fuel_type: vehicleForm.fuel_type,
        power_hp: vehicleForm.power_hp ? Number(vehicleForm.power_hp) : null,
        engine_cc: vehicleForm.engine_cc ? Number(vehicleForm.engine_cc) : null,
        color: vehicleForm.color.trim() || null,
        mileage: vehicleForm.mileage ? Number(vehicleForm.mileage) : 0,
        first_registration_date: vehicleForm.first_registration_date || null
      };

      const response = await fetch(buildUrl("/vehicles"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not create vehicle."
        );
      }

      const newVehicle = data.vehicle;

      setVehicles((currentVehicles) => [newVehicle, ...currentVehicles]);
      setSelectedVehicle(newVehicle);

      setFormData((currentData) => ({
        ...currentData,
        vehicle_id: String(newVehicle.id),
        entry_mileage: newVehicle.mileage
          ? String(newVehicle.mileage)
          : currentData.entry_mileage
      }));

      setVehicleForm(emptyVehicleForm);
      setShowVehicleForm(false);
      setSuccessMessage("Vehicle created successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!selectedCustomer) {
      setError("Please select or create a customer.");
      setStep(1);
      return;
    }

    if (!selectedVehicle || !formData.vehicle_id) {
      setError("Please select or create a vehicle.");
      setStep(2);
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a service title.");
      return;
    }

    if (!formData.service_type) {
      setError("Please select a service type.");
      return;
    }

    setIsSavingService(true);

    try {
      const payload = {
        vehicle_id: Number(formData.vehicle_id),
        employee_id: formData.employee_id ? Number(formData.employee_id) : null,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        service_type: formData.service_type,
        status: formData.status,
        priority: formData.priority,
        entry_mileage: formData.entry_mileage
          ? Number(formData.entry_mileage)
          : null,
        observations: formData.observations.trim() || null
      };

      const response = await fetch(buildUrl("/services"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not create service ticket."
        );
      }

      setFormData(emptyServiceForm);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setShowCustomerForm(false);
      setShowVehicleForm(false);
      setStep(1);
      setSuccessMessage("Service ticket created successfully.");

      if (onServiceCreated) {
        onServiceCreated(data.service);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSavingService(false);
    }
  };

  return (
    <section className="service-ticket-card">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-2">Create repair ticket</h2>
        </div>
      </div>

      <div className="service-ticket-steps">
        <button
          type="button"
          className={`service-ticket-step ${step === 1 ? "active" : ""}`}
          onClick={() => setStep(1)}
          disabled={isBusy}
        >
          Step 1
        </button>

        <button
          type="button"
          className={`service-ticket-step ${step === 2 ? "active" : ""}`}
          onClick={() => setStep(2)}
          disabled={!selectedCustomer || isBusy}
        >
          Step 2
        </button>

        <button
          type="button"
          className={`service-ticket-step ${step === 3 ? "active" : ""}`}
          onClick={() => setStep(3)}
          disabled={!selectedCustomer || !selectedVehicle || isBusy}
        >
          Step 3
        </button>
      </div>

      {isLoadingOptions && (
        <div
          className="alert alert-secondary rounded-4 d-flex align-items-center"
          role="alert"
        >
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Loading customers, vehicles and mechanics...
        </div>
      )}

      {error && (
        <div className="alert alert-danger rounded-4" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success rounded-4" role="alert">
          {successMessage}
        </div>
      )}

      {step === 1 && (
        <CustomerForm
          customers={customers}
          selectedCustomer={selectedCustomer}
          customerForm={customerForm}
          showCustomerForm={showCustomerForm}
          isBusy={isBusy}
          isSavingCustomer={isSavingCustomer}
          onSelectCustomer={handleSelectCustomer}
          onCustomerFormChange={handleCustomerFormChange}
          onCreateCustomer={handleCreateCustomer}
          onToggleCustomerForm={() =>
            setShowCustomerForm((currentValue) => !currentValue)
          }
          onContinue={() => setStep(2)}
          getCustomerLabel={getCustomerLabel}
        />
      )}

      {step === 2 && (
        <VehicleForm
          selectedCustomer={selectedCustomer}
          selectedVehicle={selectedVehicle}
          customerVehicles={customerVehicles}
          vehicleForm={vehicleForm}
          showVehicleForm={showVehicleForm}
          isBusy={isBusy}
          isSavingVehicle={isSavingVehicle}
          onSelectVehicle={handleSelectVehicle}
          onVehicleFormChange={handleVehicleFormChange}
          onCreateVehicle={handleCreateVehicle}
          onToggleVehicleForm={() =>
            setShowVehicleForm((currentValue) => !currentValue)
          }
          onClearVehicleForm={() => {
            setVehicleForm(emptyVehicleForm);
            setSelectedVehicle(null);
            setFormData((currentData) => ({
              ...currentData,
              vehicle_id: "",
              entry_mileage: ""
            }));
          }}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
          getCustomerLabel={getCustomerLabel}
          getVehicleName={getVehicleName}
          fuelTypes={FUEL_TYPES}
        />
      )}

      {step === 3 && (
        <ServiceDetailsForm
          selectedCustomer={selectedCustomer}
          selectedVehicle={selectedVehicle}
          mechanics={mechanics}
          formData={formData}
          isSavingService={isSavingService}
          onServiceFormChange={handleServiceFormChange}
          onSubmit={handleSubmit}
          onBack={() => setStep(2)}
          getCustomerLabel={getCustomerLabel}
          getVehicleName={getVehicleName}
          getMechanicLabel={getMechanicLabel}
          serviceTypes={SERVICE_TYPES}
          serviceStatuses={SERVICE_STATUSES}
          servicePriorities={SERVICE_PRIORITIES}
        />
      )}
    </section>
  );
}