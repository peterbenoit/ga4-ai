function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function countLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function createPropertyController({
  listProperties,
  fetchMetadata,
  store,
  select,
  refreshButton,
  status,
  createOption
}) {
  let token = "";

  function renderMetadata(metadata) {
    const dimensions = countLabel(metadata.dimensions.length, "dimension", "dimensions");
    const metrics = countLabel(metadata.metrics.length, "metric", "metrics");
    status.textContent = `Metadata ready: ${dimensions}, ${metrics} · ${metadata.timeZone}`;
  }

  async function loadMetadata(propertyId, { force = false } = {}) {
    status.textContent = "Loading property metadata…";
    refreshButton.disabled = true;

    try {
      await store.setLastUsedPropertyId(propertyId);
      let metadata = force ? null : await store.getCachedMetadata(propertyId);

      if (!metadata) {
        metadata = await fetchMetadata({ propertyId, token });
        await store.setCachedMetadata(propertyId, metadata);
      }

      renderMetadata(metadata);
      return metadata;
    } catch (error) {
      status.textContent = errorMessage(error);
      return null;
    } finally {
      refreshButton.disabled = false;
    }
  }

  select.addEventListener("change", () => loadMetadata(select.value));
  refreshButton.addEventListener("click", () => loadMetadata(select.value, { force: true }));

  return {
    async initialize(accessToken) {
      token = accessToken;
      select.disabled = true;
      refreshButton.hidden = true;
      status.textContent = "Loading accessible GA4 properties…";

      try {
        const properties = await listProperties({ token });

        if (properties.length === 0) {
          status.textContent = "No accessible GA4 properties were returned.";
          return;
        }

        select.replaceChildren(...properties.map(createOption));
        const lastUsed = await store.getLastUsedPropertyId();
        const selected = properties.some(({ id }) => id === lastUsed)
          ? lastUsed
          : properties[0].id;

        select.value = selected;
        select.disabled = false;
        refreshButton.hidden = false;
        await loadMetadata(selected);
      } catch (error) {
        status.textContent = errorMessage(error);
      }
    }
  };
}
