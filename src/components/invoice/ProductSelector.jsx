import React, { useState } from "react";
import toast from "react-hot-toast";

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

const getPiecesFromUom = (product, uom, qty) => {
  if (uom === "PIECE") return qty;
  if (uom === "DOZEN") return qty * 12;
  if (uom === "BOX") return qty * normalizeReward(product.boxQuantity);
  if (uom === "CARTON") return qty * normalizeReward(product.cartonQuantity);
  return qty;
};

const calculateAvailableUnits = (product, availablePieces) => {
  const pieces = Number(availablePieces) || 0;
  if (!product || pieces <= 0) return { pieces: 0, dozens: 0, boxes: 0, cartons: 0 };
  
  const boxQty = normalizeReward(product.boxQuantity, 1);
  const cartonQty = normalizeReward(product.cartonQuantity, 1);
  
  return {
    pieces: pieces,
    dozens: Math.floor(pieces / 12),
    boxes: boxQty > 0 ? Math.floor(pieces / boxQty) : 0,
    cartons: cartonQty > 0 ? Math.floor(pieces / cartonQty) : 0
  };
};

const ProductSelector = ({ products = [], items = [], onChange, userRole = null, showStock = false }) => {
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const getProductItems = (productId) => {
    return items.filter((item) => item.productID === productId);
  };

  const updateItems = (nextItems) => {
    if (typeof onChange === "function") {
      onChange(nextItems);
    }
  };

  const toggleProduct = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const addUnit = (product, uom) => {
    if (!product?._id) return;
    
    const newItem = {
      productID: product._id,
      qty: 1,
      uom: uom
    };
    
    updateItems([...items, newItem]);
    setExpandedProducts(new Set([...expandedProducts, product._id]));
  };

  const updateQuantity = (product, uom, delta) => {
    if (!product?._id) return;
    
    const existingItem = items.find(
      (item) => item.productID === product._id && item.uom === uom
    );
    
    const currentQty = existingItem?.qty || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
      // Remove item if quantity becomes 0
      updateItems(items.filter((item) => !(item.productID === product._id && item.uom === uom)));
    } else if (existingItem) {
      // Update existing item
      updateItems(
        items.map((item) =>
          item.productID === product._id && item.uom === uom
            ? { ...item, qty: newQty }
            : item
        )
      );
    } else {
      // Add new item
      updateItems([...items, { productID: product._id, qty: newQty, uom }]);
    }
  };

  const removeUnit = (productId, uom) => {
    updateItems(items.filter((item) => !(item.productID === productId && item.uom === uom)));
  };

  const checkStockAvailability = (product, uom, requestedQty) => {
    if (!showStock || userRole === "Company") return true; // Company has unlimited stock
    
    const availablePieces = product?.allocation?.pieces || 0;
    const requestedPieces = getPiecesFromUom(product, uom, requestedQty);
    
    // Calculate total pieces for all items of this product, excluding the current item being updated
    const currentItems = getProductItems(product._id);
    const totalRequestedPieces = currentItems.reduce((sum, item) => {
      // Skip the item that's being updated (same product, same UOM)
      if (item.productID === product._id && item.uom === uom) {
        return sum; // Don't include the old quantity
      }
      return sum + getPiecesFromUom(product, item.uom, item.qty);
    }, 0) + requestedPieces; // Add the new requested pieces
    
    return totalRequestedPieces <= availablePieces;
  };

  const handleQuantityChange = (product, uom, delta) => {
    const currentItem = items.find((item) => item.productID === product._id && item.uom === uom);
    const currentQty = currentItem?.qty || 0;
    const newQty = currentQty + delta;
    
    if (newQty < 0) return;
    
    if (!checkStockAvailability(product, uom, newQty)) {
      toast.error("Stock Not Available");
      return;
    }
    
    updateQuantity(product, uom, delta);
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
          const productItems = getProductItems(product._id);
          const isExpanded = expandedProducts.has(product._id);
          const availablePieces = product?.allocation?.pieces || 0;
          const availableUnits = calculateAvailableUnits(product, availablePieces);
          const hasItems = productItems.length > 0;

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
                  {showStock && userRole !== "Company" && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Available:</span>{" "}
                      {availableUnits.pieces > 0 ? (
                        <>
                          {availableUnits.pieces} pcs
                          {availableUnits.dozens > 0 && `, ${availableUnits.dozens} dz`}
                          {availableUnits.boxes > 0 && `, ${availableUnits.boxes} bx`}
                          {availableUnits.cartons > 0 && `, ${availableUnits.cartons} ct`}
                        </>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {hasItems && (
                <div className="mt-4 space-y-2">
                  {productItems.map((item, idx) => {
                    const rewardPerUnit = getRewardPerUnit(product, item.uom);
                    return (
                      <div
                        key={`${item.productID}-${item.uom}-${idx}`}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">
                            {item.qty} × {item.uom}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({getPiecesFromUom(product, item.uom, item.qty)} pcs)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(product, item.uom, -1)}
                            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-sm hover:bg-gray-100"
                          >
                            –
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(product, item.uom, 1)}
                            className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm hover:bg-primary-700"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUnit(product._id, item.uom)}
                            className="ml-2 text-red-500 hover:text-red-700 text-sm"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4">
                {!isExpanded ? (
                  <button
                    type="button"
                    onClick={() => toggleProduct(product._id)}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Unit
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Add Unit</span>
                      <button
                        type="button"
                        onClick={() => toggleProduct(product._id)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {UOM_OPTIONS.map((option) => {
                        const unitKey = option.value.toLowerCase() + "s";
                        const isDisabled = showStock && userRole !== "Company" && (availableUnits[unitKey] === 0 || availableUnits[unitKey] === undefined);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              if (!isDisabled) {
                                addUnit(product, option.value);
                                toggleProduct(product._id);
                              }
                            }}
                            disabled={isDisabled}
                            className={`text-xs py-2 px-3 rounded-lg border ${
                              isDisabled
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-primary-800 mb-2">Selection summary</h3>
        {items.length === 0 ? (
          <p className="text-sm text-primary-600">Add products using + Add Unit buttons to build an invoice.</p>
        ) : (
          <div className="space-y-2 text-sm text-primary-800">
            {products.map((product) => {
              const productItems = getProductItems(product._id);
              if (productItems.length === 0) return null;
              
              return (
                <div key={product._id} className="pb-2 border-b border-primary-200 last:border-0">
                  <div className="font-medium text-primary-900 mb-1">
                    {product.itemDescription || product.name}
                  </div>
                  {productItems.map((item, idx) => {
                    const rewardPerUnit = getRewardPerUnit(product, item.uom);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs ml-2">
                        <span>
                          {item.qty} × {item.uom}
                        </span>
                        <span className="font-semibold">
                          {rewardPerUnit * item.qty} pts
                        </span>
                      </div>
                    );
                  })}
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
