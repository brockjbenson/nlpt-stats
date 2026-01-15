"use client";

import { createSeason } from "@/app/admin/seasons/actions";
import { SeasonWithWeeks } from "@/app/admin/seasons/page";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import React from "react";

function NewSeasonDrawer({ seasons }: { seasons: SeasonWithWeeks[] }) {
  const [numWeeks, setNumWeeks] = React.useState(52);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [isOpen, setIsOpen] = React.useState(false);
  const [validYear, setValidYear] = React.useState(true);
  const [validationMessage, setValidationMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const validateYear = (yearValue: number) => {
    const yearStr = yearValue.toString();
    if (yearStr.length !== 4 || isNaN(yearValue)) {
      setValidationMessage("Please enter a valid 4-digit year.");
      setValidYear(false);
      return false;
    }

    const exists = seasons.some((season) => season.year === yearValue);
    if (exists) {
      setValidationMessage(`Season for year ${yearValue} already exists.`);
      setValidYear(false);
      return false;
    }

    setValidationMessage("");
    setValidYear(true);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateYear(year)) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await createSeason(year, numWeeks);

      if (result.error) {
        setError(result.error);
        return;
      }

      // On success:
      setIsOpen(false);
      // Reset form
      setYear(new Date().getFullYear());
      setNumWeeks(52);
      setValidYear(true);
      setError("");
    } catch (error) {
      console.error("Error creating season:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button>Add Season</Button>
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>Add New Season</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="year">Year</FieldLabel>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setYear(newYear);
                  }}
                  placeholder="2024"
                  required
                  onBlur={(e) => {
                    validateYear(Number(e.target.value));
                  }}
                />
                {!validYear && (
                  <p className="text-sm text-destructive mt-1">
                    {validationMessage}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="weeks">Number of Weeks</FieldLabel>
                <Input
                  id="weeks"
                  type="number"
                  value={numWeeks}
                  onChange={(e) => setNumWeeks(Number(e.target.value))}
                  placeholder="52"
                  required
                  min={1}
                  max={53}
                />
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={!validYear || isSubmitting}>
              {isSubmitting ? <Spinner /> : "Create Season"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default NewSeasonDrawer;
