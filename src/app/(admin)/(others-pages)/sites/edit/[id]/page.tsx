import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UpdateSitesForm from "@/components/form/form-elements/UpdateSitesForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function FormElements() {
  return (
    <div>
      {/* PageBreadcrumb removed per user request */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
        <div className="space-y-6">
          <UpdateSitesForm />
          {/* <SelectInputs />
          <TextAreaInput />
          <InputStates /> */}
        </div>
        {/* <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div> */}
      </div>
    </div>
  );
}
