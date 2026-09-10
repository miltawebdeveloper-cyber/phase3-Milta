// The last item in a breadcrumb — the page you are on.
//
// It used to be plain text on every page of the site. It is now a link to the
// page itself, which is what a breadcrumb's final crumb is expected to be: it
// gives the trail a consistent shape, and it is what Google's BreadcrumbList
// guidance asks for — every item in the list, the last one included, should name
// a URL.
//
// A drop-in for the <Typography> it replaces: `variant` and `sx` are forwarded
// untouched, so each hero keeps the exact colour, weight and letter-spacing it
// had. The only visible change is that the crumb is now clickable.
//
// `aria-current="page"` is what stops it being a trap for anyone using a screen
// reader — the link is announced as the current page rather than as somewhere
// else to go.
import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Link, Typography } from "@mui/material";

export default function CurrentCrumb({ children, sx, variant = "body2", ...rest }) {
  const { pathname, search } = useLocation();

  return (
    <Link
      component={RouterLink}
      to={`${pathname}${search || ""}`}
      aria-current="page"
      underline="none"
      sx={{ color: "inherit", display: "inline-flex", alignItems: "center" }}
    >
      <Typography variant={variant} sx={sx} {...rest}>
        {children}
      </Typography>
    </Link>
  );
}
