import React from "react";
import { useOrganizationData } from "../hooks/useOrganizationData";

/**
 * Temporary test component to validate the organization endpoint
 * Remove this component after validation
 */
const OrganizationTest: React.FC = () => {
  // Test with current week date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of week

  const { data, loading, error } = useOrganizationData({
    start_date: startDate.toISOString().split("T")[0], // YYYY-MM-DD format
    end_date: endDate.toISOString().split("T")[0],
    limit: 50,
  });

  if (loading)
    return (
      <div style={{ padding: "20px" }}>🔄 Loading organization data...</div>
    );

  if (error)
    return (
      <div style={{ padding: "20px", color: "red" }}>❌ Error: {error}</div>
    );

  if (!data) return <div style={{ padding: "20px" }}>No data received</div>;

  // Organization API response available for inspection

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f9f9f9",
        border: "1px solid #ddd",
        margin: "10px",
        borderRadius: "8px",
      }}
    >
      <h3>🧪 Organization Endpoint Test</h3>

      {/* Raw data inspection */}
      <div
        style={{
          marginBottom: "15px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
          fontSize: "12px",
        }}
      >
        <strong>Raw Response Structure:</strong>
        <pre style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Organization:</strong>{" "}
        {data.organization && data.organization.name
          ? `${data.organization.name} (ID: ${data.organization.id})`
          : "❌ No organization data found"}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Clinics:</strong>{" "}
        {data.clinics && Array.isArray(data.clinics)
          ? `${data.clinics.length} found`
          : "❌ No clinics data found"}
        {data.clinics &&
          Array.isArray(data.clinics) &&
          data.clinics.length > 0 && (
            <ul>
              {data.clinics.slice(0, 3).map((clinic) => (
                <li key={clinic.id}>{clinic.name}</li>
              ))}
              {data.clinics.length > 3 && (
                <li>... and {data.clinics.length - 3} more</li>
              )}
            </ul>
          )}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Units:</strong>{" "}
        {data.units && Array.isArray(data.units)
          ? `${data.units.length} found`
          : "❌ No units data found"}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Doctors:</strong>{" "}
        {data.doctors && Array.isArray(data.doctors)
          ? `${data.doctors.length} found`
          : "❌ No doctors data found"}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Appointments:</strong>{" "}
        {data.appointments && Array.isArray(data.appointments)
          ? `${data.appointments.length} found for this week`
          : "❌ No appointments data found"}
      </div>
      <div style={{ fontSize: "12px", color: "#666" }}>
        ✅ Endpoint working! Check console for full response data.
      </div>
    </div>
  );
};

export default OrganizationTest;
