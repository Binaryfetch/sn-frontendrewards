import React from "react";

const UOM_OPTIONS = [
  { label: "Piece", value: "PIECE" },
  { label: "Dozen", value: "DOZEN" },
  { label: "Box", value: "BOX" },
  { label: "Carton", value: "CARTON" }
];

const normalizeReward = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getRewardPerUnit = (product, uom) => {
  if (!product) return 0;
  if (uom === "PIECE") return normalizeReward(product.rewardsPerPc);
  if (uom === "DOZEN") return normalizeReward(product.rewardsPerDozen, normalizeReward(product.rewardsPerPc) * 12);
  if (uom === "BOX") {
    const quantity = normalizeReward(product.boxQuantity);
    return normalizeReward(product.rewardsForBox, normalizeReward(product.rewardsPerPc) * quantity);
  }
  if (uom === "CARTON") {
    const quantity = normalizeReward(product.cartonQuantity);
    return normalizeReward(product.rewardsForCarton, normalizeReward(product.rewardsPerPc) * quantity);
  }
  return 0;
};

const ProductSelector = ({ products = [], items = [], onChange }) => {
  const findItem = (productId) => items.find((item) => item.productID === productId);

  const updateItems = (nextItems) => {
    if (typeof onChange === "function") {
      onChange(nextItems);
    }
  };

  const handleQuantityChange = (product, delta) => {
    if (!product?._id) return;
    const existing = findItem(product._id) || { productID: product._id, qty: 0, uom: "PIECE" };
    const nextQty = Math.max(0, (existing.qty || 0) + delta);

    if (nextQty === 0) {
      updateItems(items.filter((item) => item.productID !== product._id));
      return;
    }

    const nextItem = { ...existing, qty: nextQty };
    const nextItems = items.some((item) => item.productID === product._id)
      ? items.map((item) => (item.productID === product._id ? nextItem : item))
      : [...items, nextItem];

    updateItems(nextItems);
  };

  const handleUomChange = (product, newUom) => {
    if (!product?._id) return;
    const existing = findItem(product._id);

    if (!existing) {
      updateItems([...items, { productID: product._id, qty: 1, uom: newUom }]);
      return;
    }

    const nextItems = items.map((item) =>
      item.productID === product._id ? { ...item, uom: newUom } : item
    );
    updateItems(nextItems);
  };

  const summary = items.reduce(
    (acc, item) => {
      const product = products.find((prod) => prod._id === item.productID);
      const rewardPerUnit = getRewardPerUnit(product, item.uom);
      acc.totalQty += item.qty;
      acc.totalItems += 1;
      acc.totalRewards += rewardPerUnit * item.qty;
      return acc;
    },
    { totalQty: 0, totalRewards: 0, totalItems: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => {
          const selectedItem = findItem(product._id);
          const currentQty = selectedItem?.qty || 0;
          const currentUom = selectedItem?.uom || "PIECE";
          const rewardPerUnit = getRewardPerUnit(product, currentUom);

          return (
            <div
              key={product._id}
              className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col"
            >
              <div className="flex items-start space-x-4">
                {product.imageURL ? (
                  <img
                    src={product.imageURL}
                    alt={product.itemDescription || product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {product.itemDescription || product.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Unit</label>
                  <select
                    className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                    value={currentUom}
                    onChange={(event) => handleUomChange(product, event.target.value)}
                  >
                    {UOM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product, -1)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center"
                    >
                      –
                    </button>
                    <span className="w-10 text-center font-semibold">{currentQty}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product, 1)}
                      className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Reward / unit: <span className="font-semibold text-primary-600">{rewardPerUnit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-primary-800 mb-2">Selection summary</h3>
        {items.length === 0 ? (
          <p className="text-sm text-primary-600">Add products using + buttons to build an invoice.</p>
        ) : (
          <div className="space-y-2 text-sm text-primary-800">
            {items.map((item) => {
              const product = products.find((prod) => prod._id === item.productID);
              const name = product?.itemDescription || product?.name || "Product";
              return (
                <div key={item.productID} className="flex items-center justify-between">
                  <span>{name}</span>
                  <span className="font-semibold">
                    {item.qty} × {item.uom}
                  </span>
                </div>
              );
            })}
            <div className="pt-2 mt-2 border-t border-primary-200 text-sm font-semibold flex justify-between">
              <span>Total items</span>
              <span>{summary.totalItems}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total quantity</span>
              <span>{summary.totalQty}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-primary-900">
              <span>Projected rewards</span>
              <span>{summary.totalRewards.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelector;

