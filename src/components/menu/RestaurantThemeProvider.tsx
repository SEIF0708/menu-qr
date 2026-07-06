import React from "react";

/**
 * Ensures that the restaurant's custom theme variables are applied.
 * Currently, if the database doesn't have theme properties, it uses the default tailwind classes.
 * We can extract primaryColor, secondaryColor etc. if they exist in restaurant.metadata_json or similar future fields.
 */
export function RestaurantThemeProvider({
  restaurant,
  children,
}: {
  restaurant: any;
  children: React.ReactNode;
}) {
  // If in the future, `restaurant` contains `primaryColor`, `secondaryColor`, etc.
  // We can apply them to the style object here.
  const style = React.useMemo(() => {
    const customStyle: React.CSSProperties = {};
    const theme = (restaurant as any).theme_settings; // Example field for future-proofing

    if (theme?.primaryColor) {
      customStyle["--primary" as any] = theme.primaryColor;
    }
    if (theme?.secondaryColor) {
      customStyle["--secondary" as any] = theme.secondaryColor;
    }
    if (theme?.accentColor) {
      customStyle["--accent" as any] = theme.accentColor;
    }

    return customStyle;
  }, [restaurant]);

  return (
    <div style={style} className="contents">
      {children}
    </div>
  );
}
