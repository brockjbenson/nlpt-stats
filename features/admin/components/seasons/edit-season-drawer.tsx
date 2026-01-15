"use client";

import { updateSeason } from "@/app/admin/seasons/actions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Pencil } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface EditSeasonDrawerProps {
  seasons: SeasonWithWeeks[];
  season: SeasonWithWeeks;
}

function EditSeasonDrawer({ seasons, season }: EditSeasonDrawerProps) {
  const router = useRouter();
  const [numWeeks, setNumWeeks] = React.useState(season.week.length);
  const [year, setYear] = React.useState(season.year);
  const [isOpen, setIsOpen] = React.useState(false);
  const [yearError, setYearError] = React.useState("");
  const [weeksError, setWeeksError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [affectedSessions, setAffectedSessions] = React.useState(0);

  // Reset form when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setNumWeeks(season.week.length);
      setYear(season.year);
      setYearError("");
      setWeeksError("");
      setSubmitError("");
      setShowConfirmDialog(false);
      setAffectedSessions(0);
    }
  }, [isOpen, season]);

  const validateYear = (yearValue: number): boolean => {
    const yearStr = yearValue.toString();

    if (yearStr.length !== 4 || isNaN(yearValue)) {
      setYearError("Please enter a valid 4-digit year.");
      return false;
    }

    if (yearValue < 1900 || yearValue > 2100) {
      setYearError("Year must be between 1900 and 2100.");
      return false;
    }

    const exists = seasons.some(
      (s) => s.year === yearValue && s.id !== season.id
    );

    if (exists) {
      setYearError(`Season for year ${yearValue} already exists.`);
      return false;
    }

    setYearError("");
    return true;
  };

  const validateWeeks = (weeks: number): boolean => {
    if (isNaN(weeks) || weeks < 1 || weeks > 53) {
      setWeeksError("Number of weeks must be between 1 and 53.");
      return false;
    }

    setWeeksError("");
    return true;
  };

  const hasChanges = season.year !== year || season.week.length !== numWeeks;

  const isFormValid =
    !yearError && !weeksError && hasChanges && year.toString().length === 4;

  const performUpdate = async (confirmDelete: boolean = false) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await updateSeason(
        season.id,
        year,
        numWeeks,
        confirmDelete
      );

      if ("error" in result) {
        setSubmitError(result.error);
        return;
      }

      if ("requiresConfirmation" in result) {
        setAffectedSessions(result.affectedSessions);
        setShowConfirmDialog(true);
        return;
      }

      // Success
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating season:", error);
      setSubmitError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Validate all fields
    const isYearValid = validateYear(year);
    const isWeeksValid = validateWeeks(numWeeks);

    if (!isYearValid || !isWeeksValid) {
      return;
    }

    await performUpdate(false);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDialog(false);
    await performUpdate(true);
  };

  const handleYearChange = (value: string) => {
    const newYear = Number(value);
    setYear(newYear);

    if (value.length === 4) {
      validateYear(newYear);
    } else if (yearError) {
      setYearError("");
    }
  };

  const handleWeeksChange = (value: string) => {
    const newWeeks = Number(value);
    setNumWeeks(newWeeks);
    validateWeeks(newWeeks);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon">
            <Pencil size={16} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <form onSubmit={handleSubmit}>
            <DrawerHeader>
              <DrawerTitle>Edit Season {season.year}</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="year">Year</FieldLabel>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    onBlur={() => validateYear(year)}
                    placeholder="2024"
                    required
                    disabled={isSubmitting}
                  />
                  {yearError && (
                    <p className="text-sm text-destructive mt-1">{yearError}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="weeks">Number of Weeks</FieldLabel>
                  <Input
                    id="weeks"
                    type="number"
                    value={numWeeks}
                    onChange={(e) => handleWeeksChange(e.target.value)}
                    placeholder="52"
                    required
                    min={1}
                    max={53}
                    disabled={isSubmitting}
                  />
                  {weeksError && (
                    <p className="text-sm text-destructive mt-1">
                      {weeksError}
                    </p>
                  )}
                </Field>
              </FieldGroup>

              {submitError && (
                <p className="text-sm text-destructive mt-2">{submitError}</p>
              )}
            </div>

            <DrawerFooter>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? <Spinner /> : "Save Changes"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Reducing the number of weeks will delete {affectedSessions}{" "}
              session{affectedSessions !== 1 ? "s" : ""} associated with the
              removed weeks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? <Spinner /> : "Delete Sessions"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default EditSeasonDrawer;
