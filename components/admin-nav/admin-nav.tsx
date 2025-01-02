import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

function AdminNav() {
  return (
    <aside>
      <Accordion type="multiple">
        <AccordionItem value="Stats">
          <AccordionTrigger>Stats</AccordionTrigger>
          <AccordionContent>asdf</AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

export default AdminNav;
